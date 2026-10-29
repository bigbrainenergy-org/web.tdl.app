import { useRepo } from 'pinia-orm'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { type DayOfWeek, DAYS_OF_WEEK, type Schedule, ScheduleRepo } from 'src/stores/schedules/schedule'
import type { Task, TaskDepRef } from 'src/stores/tasks/task-model'
import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
import { useTaskStore } from 'src/stores/tasks/task-store'
import { Logger } from 'src/utils/d'
import { computeInheritedDeadline, type InheritedDeadlineResult } from 'src/utils/inherited-deadline'
import { ListRepo } from 'src/stores/lists/list'

const SchedulerLogger = new Logger('Auto-Scheduler', '#2E86AB')

// --- Public interfaces ---

export interface ScheduledItem {
  task: Task
  startTime: Date
  endTime: Date
  durationMinutes: number
  scheduleTitle: string
}

export interface AtRiskItem {
  task: Task
  deadline: Date
  reason: string
}

export interface PriorityBreakdown {
  total: number
  layerWeight: number
  starWeight: number
  projectLayerWeight: number
  inProgressBonus: number
  dueDateBonus: number
  scheduleBonus: number
  procedureBonus: number
}

export interface AutoScheduleResult {
  scheduled: ScheduledItem[]
  atRisk: AtRiskItem[]
  breakdowns: Map<number, PriorityBreakdown>
}

// --- Internal types ---

interface TimeSlot {
  startMs: number
  endMs: number
}

type ScheduleKey = number | 'fallback'

// --- Timeline generation ---

function generateTimeline(
  schedule: Schedule | null,
  startFrom: Date,
  horizonDays: number
): TimeSlot[] {
  const slots: TimeSlot[] = []

  for (let d = 0; d < horizonDays; d++) {
    const date = new Date(startFrom)
    date.setDate(date.getDate() + d)
    const dayIndex = date.getDay()
    const day: DayOfWeek = DAYS_OF_WEEK[dayIndex]!

    const blocks = schedule
      ? schedule.blocks.filter(b => b.day_of_week === day)
      : [{ day_of_week: day, start: '09:00', end: '17:00' }]

    for (const block of blocks) {
      const [sh, sm] = block.start.split(':').map(Number)
      const [eh, em] = block.end.split(':').map(Number)

      const slotStart = new Date(date)
      slotStart.setHours(sh!, sm, 0, 0)

      const slotEnd = new Date(date)
      slotEnd.setHours(eh!, em, 0, 0)

      const startMs = slotStart.getTime()
      const endMs = slotEnd.getTime()
      if (endMs <= startMs) continue
      slots.push({ startMs, endMs })
    }
  }

  slots.sort((a, b) => a.startMs - b.startMs)

  // Clip past slots
  const nowMs = startFrom.getTime()
  const clipped: TimeSlot[] = []
  for (const slot of slots) {
    if (slot.endMs <= nowMs) continue
    if (slot.startMs < nowMs) {
      const roundedMs = Math.ceil(nowMs / (15 * 60_000)) * (15 * 60_000)
      if (roundedMs >= slot.endMs) continue
      clipped.push({ startMs: roundedMs, endMs: slot.endMs })
    } else {
      clipped.push(slot)
    }
  }

  return clipped
}

// --- Schedule resolution ---

function resolveTaskSchedule(
  task: Task,
  defaultSchedule: Schedule | null,
  cache: Map<number, Schedule | null>,
  inheritedProjectSchedule?: Map<number, number | null>
): Schedule | null {
  if (cache.has(task.id)) return cache.get(task.id)!

  let schedule: Schedule | null = null

  const scheduleRepo = useRepo(ScheduleRepo)
  const listRepo = useRepo(ListRepo)

  if (task.schedule_id) {
    schedule = scheduleRepo.find(task.schedule_id) ?? null
  }
  if (!schedule && inheritedProjectSchedule) {
    const projectScheduleId = inheritedProjectSchedule.get(task.id)
    if (projectScheduleId) {
      schedule = scheduleRepo.find(projectScheduleId) ?? null
    }
  }
  if (!schedule && task.list_id) {
    const list = listRepo.find(task.list_id)
    if (list?.schedule_id) {
      schedule = scheduleRepo.find(list.schedule_id) ?? null
    }
  }
  if (!schedule) {
    schedule = defaultSchedule
  }

  cache.set(task.id, schedule)
  return schedule
}

// --- Helpers ---

function formatHHmm(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// --- Per-schedule state ---

interface ScheduleState {
  slots: TimeSlot[]
  cursor: number      // index into slots, only advances
  queue: Task[]       // sorted by priority descending (highest first)
  schedule: Schedule | null
}

/**
 * Check if a schedule has an active block at `timeMs`.
 * Advances cursor past consumed slots.
 * Returns { active, slotEndMs, nextStartMs }.
 */
function getActiveSlot(
  state: ScheduleState,
  timeMs: number
): { active: boolean; slotEndMs: number; nextStartMs: number | null } {
  while (state.cursor < state.slots.length) {
    const slot = state.slots[state.cursor]!
    if (timeMs < slot.endMs) {
      // This slot is still relevant
      if (timeMs >= slot.startMs) {
        return { active: true, slotEndMs: slot.endMs, nextStartMs: null }
      } else {
        // timeMs is before this slot — slot starts in the future
        return { active: false, slotEndMs: 0, nextStartMs: slot.startMs }
      }
    }
    // Slot fully consumed
    state.cursor++
  }
  // No more slots
  return { active: false, slotEndMs: 0, nextStartMs: null }
}

// --- Main algorithm ---

export function runAutoScheduler(allTasks: Task[]): AutoScheduleResult {
  const t0 = performance.now()
  const localSettings = useLocalSettingsStore()
  const taskStore = useTaskStore()
  const taskMap = taskStore.mapp
  const taskStarredStore = useTaskStarredStore()
  const scheduleRepo = useRepo(ScheduleRepo)

  const allSchedules = scheduleRepo.all()
  const defaultSchedule = allSchedules.find(s => s.default) ?? null
  const defaultDuration = localSettings.defaultTaskDuration
  const unsetDegreeBehavior = localSettings.unsetDegreeBehavior
  const breakMs = localSettings.taskBreaksBetween * 60_000
  const {
    schedulerStarMod,
    schedulerProjectMod,
    schedulerInProgressMod,
    schedulerDueDateMod,
    schedulerScheduleMod,
    schedulerProcedureMod
  } = localSettings

  // ===== PRE-COMPUTATION =====

  const incompleteTasks = allTasks.filter(t => !t.completed)
  SchedulerLogger.log(`Starting with ${incompleteTasks.length} incomplete tasks`)

  // Dependency ref caches
  const incompletePresCache = new Map<number, TaskDepRef[]>()
  const incompletePostsCache = new Map<number, TaskDepRef[]>()

  const getIncompletePres = (task: Task): TaskDepRef[] => {
    let cached = incompletePresCache.get(task.id)
    if (cached === undefined) {
      cached = task.pres.filter(r => !r.task.completed)
      incompletePresCache.set(task.id, cached)
    }
    return cached
  }

  const getIncompletePosts = (task: Task): TaskDepRef[] => {
    let cached = incompletePostsCache.get(task.id)
    if (cached === undefined) {
      cached = task.posts.filter(r => !r.task.completed)
      incompletePostsCache.set(task.id, cached)
    }
    return cached
  }

  const isHardDegree = (degree: 1 | 2 | 3 | null): boolean => {
    if (degree === null) return unsetDegreeBehavior >= 2
    return degree >= 2
  }

  // Project depth
  const ptarr = incompleteTasks.filter(x => x.notes?.includes('!PROJECT'))
  const projectids = ptarr.map(x => x.id)
  const inProgressProjectIds = new Set(ptarr.filter(x => x.notes?.includes('!INPROGRESS')).map(x => x.id))
  const projectTasks = new Set(projectids)
  const projectDepth = new Map<number, number>()
  const projectVisiting = new Set<number>()

  const calculateProjectDepth = (x: Task): number => {
    if (projectDepth.has(x.id)) return projectDepth.get(x.id)!
    if (projectVisiting.has(x.id)) return 0
    projectVisiting.add(x.id)
    let depth = 0
    const pres = x.grabPrereqs(true)
    if (pres.length === 0) {
      projectDepth.set(x.id, depth)
      projectVisiting.delete(x.id)
      return depth
    }
    pres.forEach(y => {
      if (projectTasks.has(y.id)) {
        if (projectDepth.has(y.id)) {
          depth = Math.max(projectDepth.get(y.id)!, depth + 1)
        } else depth = Math.max(calculateProjectDepth(y), depth + 1)
      }
    })
    depth = Math.min(depth, 5)
    projectDepth.set(x.id, depth)
    projectVisiting.delete(x.id)
    return depth
  }
  ptarr.forEach(calculateProjectDepth)

  const associatedProjectDepth = new Map<number, { depth: number; inprogress: boolean }>()
  const calculateAssociatedProjectDepth = (x: Task): { depth: number; inprogress: boolean } => {
    if (associatedProjectDepth.has(x.id)) return associatedProjectDepth.get(x.id)!
    if (projectTasks.has(x.id)) {
      const depth = projectDepth.get(x.id) ?? 0
      const inprogress = inProgressProjectIds.has(x.id)
      const result = { depth, inprogress }
      associatedProjectDepth.set(x.id, result)
      return result
    }
    const hardPosts = getIncompletePosts(x).filter(r => isHardDegree(r.degree))
    if (hardPosts.length === 0) {
      const result = { depth: -1, inprogress: false }
      associatedProjectDepth.set(x.id, result)
      return result
    }
    let minDepth = -1
    let hasInProgressAtMinDepth = false
    for (const ref of hardPosts) {
      const postResult = associatedProjectDepth.has(ref.task.id)
        ? associatedProjectDepth.get(ref.task.id)!
        : calculateAssociatedProjectDepth(ref.task)
      if (postResult.depth !== -1) {
        if (minDepth === -1 || postResult.depth < minDepth) {
          minDepth = postResult.depth
          hasInProgressAtMinDepth = postResult.inprogress
        } else if (postResult.depth === minDepth && postResult.inprogress) {
          hasInProgressAtMinDepth = true
        }
      }
    }
    const result = { depth: minDepth, inprogress: hasInProgressAtMinDepth }
    associatedProjectDepth.set(x.id, result)
    return result
  }
  incompleteTasks.forEach(calculateAssociatedProjectDepth)

  // Inherited project schedule (walk hard postreqs to nearest project with a schedule)
  const inheritedProjectSchedule = new Map<number, number | null>()
  const computeInheritedProjectSchedule = (task: Task): number | null => {
    if (inheritedProjectSchedule.has(task.id)) return inheritedProjectSchedule.get(task.id)!
    if (projectTasks.has(task.id) && task.schedule_id) {
      inheritedProjectSchedule.set(task.id, task.schedule_id)
      return task.schedule_id
    }
    const hardPosts = getIncompletePosts(task).filter(r => isHardDegree(r.degree))
    for (const ref of hardPosts) {
      const result = computeInheritedProjectSchedule(ref.task)
      if (result !== null) {
        inheritedProjectSchedule.set(task.id, result)
        return result
      }
    }
    inheritedProjectSchedule.set(task.id, null)
    return null
  }
  incompleteTasks.forEach(computeInheritedProjectSchedule)

  // Inherited deadlines
  const deadlineMemo = new Map<number, InheritedDeadlineResult | null>()
  const deadlineVisited = new Set<number>()

  // Task layers (hard deps only)
  const taskLayers = new Map<number, number>()
  const layerVisiting = new Set<number>()

  const computeLayer = (task: Task): number => {
    if (taskLayers.has(task.id)) return taskLayers.get(task.id)!
    if (layerVisiting.has(task.id)) return 0
    layerVisiting.add(task.id)
    const pres = getIncompletePres(task)
    let maxLayer = -1
    for (const ref of pres) {
      if (!isHardDegree(ref.degree)) continue
      maxLayer = Math.max(maxLayer, computeLayer(ref.task))
    }
    const layer = maxLayer + 1
    taskLayers.set(task.id, layer)
    layerVisiting.delete(task.id)
    return layer
  }

  // Star weights
  const starVisited = new Set<number>()
  incompleteTasks.forEach(t => taskStarredStore.computeDescendants(t.id, taskMap, starVisited))

  incompleteTasks.forEach(computeLayer)

  // Schedule resolution
  const taskScheduleCache = new Map<number, Schedule | null>()
  const now = new Date()
  const currentDay: DayOfWeek = DAYS_OF_WEEK[now.getDay()]!
  const currentTimeHHmm = formatHHmm(now)

  // Priority weight — computed once per task, cached with full breakdown
  const priorityCache = new Map<number, PriorityBreakdown>()

  const getPriorityWeight = (task: Task): number => {
    const cached = priorityCache.get(task.id)
    if (cached !== undefined) return cached.total

    const layer = taskLayers.get(task.id) ?? 0
    const layerWeight = (100 - layer) * 10

    const isStarred = taskStarredStore.isStarred(task.id) ? 2 : 0
    const descendantCount = taskStarredStore.getStarredDescendantCount(task.id) > 0 ? 1 : 0
    const starWeight = (isStarred + descendantCount) * 100

    const apdResult = associatedProjectDepth.get(task.id)
    const apd = apdResult?.depth ?? -1
    const projectLayerWeight = apd === -1 ? 300 : 250 - (apd * 50)
    const inProgressBonus = apdResult?.inprogress ? 50 : 0

    let dueDateBonus = 0
    const inherited = computeInheritedDeadline(task, deadlineMemo, deadlineVisited, defaultDuration, isHardDegree)
    if (inherited) {
      const hoursRemaining = (inherited.deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
      if (hoursRemaining > 0) {
        dueDateBonus = Math.min(200, 100 * Math.pow(0.7, hoursRemaining / 24))
      } else {
        if(inherited.isOwn) dueDateBonus = 300
        else dueDateBonus = 200
      }
    }

    let scheduleBonus = 0
    const taskSchedule = resolveTaskSchedule(task, defaultSchedule, taskScheduleCache, inheritedProjectSchedule)
    if (taskSchedule) {
      if (taskSchedule.isActiveAt(currentDay, currentTimeHHmm)) {
        const incompletePres = getIncompletePres(task)
        const onlyWeakBlocks = incompletePres.every(r => r.degree === 1)
        if (incompletePres.length === 0 || onlyWeakBlocks) {
          scheduleBonus = 500
        }
      }
    } else {
      const h = now.getHours()
      if (h >= 9 && h < 17) {
        scheduleBonus = 500
      }
    }

    const procedureBonus = (task.procedure_ids?.length ?? 0) > 0 ? 450 : 0

    const total = layerWeight
      + starWeight * schedulerStarMod
      + projectLayerWeight * schedulerProjectMod
      + inProgressBonus * schedulerInProgressMod
      + dueDateBonus * schedulerDueDateMod
      + scheduleBonus * schedulerScheduleMod
      + procedureBonus * schedulerProcedureMod
    const breakdown: PriorityBreakdown = {
      total,
      layerWeight,
      starWeight,
      projectLayerWeight,
      inProgressBonus,
      dueDateBonus,
      scheduleBonus,
      procedureBonus
    }
    priorityCache.set(task.id, breakdown)
    return total
  }

  // ===== SCHEDULE SETUP =====

  const horizonDays = 90
  const scheduleStates = new Map<ScheduleKey, ScheduleState>()

  const getScheduleKey = (schedule: Schedule | null): ScheduleKey => schedule ? schedule.id : 'fallback'

  const ensureSchedule = (schedule: Schedule | null): ScheduleKey => {
    const key = getScheduleKey(schedule)
    if (!scheduleStates.has(key)) {
      const slots = generateTimeline(schedule, now, horizonDays)
      scheduleStates.set(key, {
        slots,
        cursor: 0,
        queue: [],
        schedule
      })
    }
    return key
  }

  // Resolve schedule for every task
  const taskScheduleKeyMap = new Map<number, ScheduleKey>()
  for (const task of incompleteTasks) {
    const schedule = resolveTaskSchedule(task, defaultSchedule, taskScheduleCache, inheritedProjectSchedule)
    const key = ensureSchedule(schedule)
    taskScheduleKeyMap.set(task.id, key)
  }

  // Binary-search insert into a sorted queue (highest priority first)
  const insertIntoQueue = (state: ScheduleState, task: Task) => {
    const weight = getPriorityWeight(task)
    const queue = state.queue
    let left = 0
    let right = queue.length
    while (left < right) {
      const mid = (left + right) >> 1
      if (getPriorityWeight(queue[mid]!) >= weight) {
        left = mid + 1
      } else {
        right = mid
      }
    }
    queue.splice(left, 0, task)
  }

  // ===== SEED READY QUEUES =====

  const hardPrereqCount = new Map<number, number>()
  const hardPrereqsSatisfied = new Map<number, number>()
  const placed = new Set<number>()

  for (const task of incompleteTasks) {
    const pres = getIncompletePres(task)
    const hardCount = pres.filter(r => isHardDegree(r.degree)).length
    hardPrereqCount.set(task.id, hardCount)
    hardPrereqsSatisfied.set(task.id, 0)

    if (hardCount === 0) {
      const key = taskScheduleKeyMap.get(task.id)!
      insertIntoQueue(scheduleStates.get(key)!, task)
    }
  }

  const tPrecomp = performance.now() - t0

  // ===== MAIN LOOP: FORWARD TIME WALK =====

  const scheduled: ScheduledItem[] = []
  const atRisk: AtRiskItem[] = []
  let currentTimeMs = now.getTime()
  const maxFitScan = 10 // max tasks to scan in a queue for fit

  const maxIterations = 3 * incompleteTasks.length
  let iterations = 0

  while (iterations < maxIterations) {
    iterations++

    // 1. Find all active schedules at currentTime, and next block start for inactive ones
    type ActiveInfo = { key: ScheduleKey; state: ScheduleState; remainingMs: number; slotEndMs: number }
    const activeSchedules: ActiveInfo[] = []
    let nextBlockStart = Infinity

    for (const [key, state] of scheduleStates) {
      if (state.queue.length === 0) continue
      const slotInfo = getActiveSlot(state, currentTimeMs)
      if (slotInfo.active) {
        activeSchedules.push({
          key,
          state,
          remainingMs: slotInfo.slotEndMs - currentTimeMs,
          slotEndMs: slotInfo.slotEndMs
        })
      } else if (slotInfo.nextStartMs !== null && slotInfo.nextStartMs < nextBlockStart) {
        nextBlockStart = slotInfo.nextStartMs
      }
    }

    // 2. If no schedule is active, jump to next block start
    if (activeSchedules.length === 0) {
      if (nextBlockStart === Infinity) break // no more slots
      currentTimeMs = nextBlockStart
      continue
    }

    // 3. Among active schedules, find the best task that fits
    let bestTask: Task | null = null
    let bestScore = -Infinity
    let bestIndex = -1
    let bestState: ScheduleState | null = null

    for (const info of activeSchedules) {
      const queue = info.state.queue
      const limit = Math.min(queue.length, maxFitScan)
      for (let i = 0; i < limit; i++) {
        const task = queue[i]!
        if (placed.has(task.id)) continue
        const durationMs = (task.task_duration_in_minutes ?? defaultDuration) * 60_000
        if (durationMs <= info.remainingMs) {
          const score = getPriorityWeight(task)
          if (score > bestScore) {
            bestTask = task
            bestScore = score
            bestIndex = i
            bestState = info.state
          }
          break // this queue's best fitting task found (queue is sorted by priority)
        }
        // Top task doesn't fit — try next (might be shorter)
      }
    }

    // 4. If nothing fits, advance past the earliest-ending active block
    if (!bestTask || !bestState) {
      let earliestEnd = Infinity
      for (const info of activeSchedules) {
        if (info.slotEndMs < earliestEnd) earliestEnd = info.slotEndMs
      }
      currentTimeMs = earliestEnd
      continue
    }

    // 5. Place the task
    bestState.queue.splice(bestIndex, 1)
    placed.add(bestTask.id)

    const duration = bestTask.task_duration_in_minutes ?? defaultDuration
    const durationMs = duration * 60_000
    const startMs = currentTimeMs
    const endMs = startMs + durationMs

    const inherited = computeInheritedDeadline(bestTask, deadlineMemo, deadlineVisited, defaultDuration, isHardDegree)
    if (inherited && endMs > inherited.deadline.getTime()) {
      atRisk.push({
        task: bestTask,
        deadline: inherited.deadline,
        reason: `Scheduled end ${formatHHmm(new Date(endMs))} exceeds deadline`
      })
    }

    scheduled.push({
      task: bestTask,
      startTime: new Date(startMs),
      endTime: new Date(endMs),
      durationMinutes: duration,
      scheduleTitle: bestState.schedule?.title ?? 'Default'
    })

    currentTimeMs = endMs + breakMs

    // 6. Unlock postreqs
    for (const ref of getIncompletePosts(bestTask)) {
      const postId = ref.task.id
      if (!hardPrereqCount.has(postId)) continue
      if (!isHardDegree(ref.degree)) continue

      const current = hardPrereqsSatisfied.get(postId) ?? 0
      const newCount = current + 1
      hardPrereqsSatisfied.set(postId, newCount)

      const total = hardPrereqCount.get(postId) ?? 0
      if (newCount >= total && !placed.has(postId)) {
        const postKey = taskScheduleKeyMap.get(postId)!
        insertIntoQueue(scheduleStates.get(postKey)!, ref.task)
      }
    }
  }

  // Sort chronologically (already in order, safety measure)
  scheduled.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  // Stuck tasks
  const notPlaced = incompleteTasks.filter(t => !placed.has(t.id))
  if (notPlaced.length > 0) {
    SchedulerLogger.warn(`${notPlaced.length} tasks could not be scheduled (possible cycles)`)
  }

  const elapsed = performance.now() - t0
  SchedulerLogger.log(`Completed in ${elapsed.toFixed(1)}ms (precomp: ${tPrecomp.toFixed(1)}ms): ${scheduled.length} scheduled, ${atRisk.length} at-risk, ${notPlaced.length} stuck`)

  return { scheduled, atRisk, breakdowns: priorityCache }
}
