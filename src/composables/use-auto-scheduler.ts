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

export interface AutoScheduleResult {
  scheduled: ScheduledItem[]
  atRisk: AtRiskItem[]
}

// --- Internal types ---

interface TimeSlot {
  start: Date
  end: Date
}

// --- ScheduleTimeline: per-schedule time consumption tracker ---

class ScheduleTimeline {
  private slots: TimeSlot[]
  private currentSlotIndex = 0
  private currentOffsetMs = 0 // milliseconds into current slot that are consumed

  constructor(slots: TimeSlot[]) {
    this.slots = slots
  }

  peekNextStart(): Date | null {
    while (this.currentSlotIndex < this.slots.length) {
      const slot = this.slots[this.currentSlotIndex]!
      const startMs = slot.start.getTime() + this.currentOffsetMs
      if (startMs < slot.end.getTime()) {
        return new Date(startMs)
      }
      this.currentSlotIndex++
      this.currentOffsetMs = 0
    }
    return null
  }

  allocate(durationMinutes: number): { start: Date; end: Date } | null {
    const durationMs = durationMinutes * 60_000
    while (this.currentSlotIndex < this.slots.length) {
      const slot = this.slots[this.currentSlotIndex]!
      const slotStart = slot.start.getTime() + this.currentOffsetMs
      const slotRemaining = slot.end.getTime() - slotStart

      if (slotRemaining <= 0) {
        this.currentSlotIndex++
        this.currentOffsetMs = 0
        continue
      }

      if (durationMs <= slotRemaining) {
        // Task fits in current slot
        const start = new Date(slotStart)
        const end = new Date(slotStart + durationMs)
        this.currentOffsetMs += durationMs
        return { start, end }
      } else {
        // Task doesn't fit in remaining slot — move to next slot
        this.currentSlotIndex++
        this.currentOffsetMs = 0
      }
    }
    return null // no space left in horizon
  }
}

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
      : [{ day_of_week: day, start: '09:00', end: '17:00' }] // fallback: 9-5 all days

    for (const block of blocks) {
      const [sh, sm] = block.start.split(':').map(Number)
      const [eh, em] = block.end.split(':').map(Number)

      const slotStart = new Date(date)
      slotStart.setHours(sh!, sm!, 0, 0)

      const slotEnd = new Date(date)
      slotEnd.setHours(eh!, em!, 0, 0)

      if (slotEnd.getTime() <= slotStart.getTime()) continue
      slots.push({ start: slotStart, end: slotEnd })
    }
  }

  // Sort chronologically
  slots.sort((a, b) => a.start.getTime() - b.start.getTime())

  // Clip slots that are in the past
  const now = startFrom.getTime()
  const clipped: TimeSlot[] = []
  for (const slot of slots) {
    if (slot.end.getTime() <= now) continue
    if (slot.start.getTime() < now) {
      // Round up to next 15-min boundary
      const roundedMs = Math.ceil(now / (15 * 60_000)) * (15 * 60_000)
      if (roundedMs >= slot.end.getTime()) continue
      clipped.push({ start: new Date(roundedMs), end: slot.end })
    } else {
      clipped.push(slot)
    }
  }

  return clipped
}

// --- Schedule resolution ---

function resolveTaskSchedule(
  task: Task,
  scheduleRepo: ReturnType<typeof useRepo<typeof ScheduleRepo>>,
  listRepo: ReturnType<typeof useRepo<typeof ListRepo>>,
  defaultSchedule: Schedule | null,
  cache: Map<number, Schedule | null>
): Schedule | null {
  if (cache.has(task.id)) return cache.get(task.id)!

  let schedule: Schedule | null = null

  if (task.schedule_id) {
    schedule = scheduleRepo.find(task.schedule_id) ?? null
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

// --- Priority computation ---

function formatHHmm(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// --- Main algorithm ---

export function runAutoScheduler(allTasks: Task[]): AutoScheduleResult {
  const startTime = performance.now()
  const localSettings = useLocalSettingsStore()
  const taskStore = useTaskStore()
  const taskMap = taskStore.mapp
  const taskStarredStore = useTaskStarredStore()
  const scheduleRepo = useRepo(ScheduleRepo)
  const listRepo = useRepo(ListRepo)

  const allSchedules = scheduleRepo.all()
  const defaultSchedule = allSchedules.find(s => s.default) ?? null
  const defaultDuration = localSettings.defaultTaskDuration
  const unsetDegreeBehavior = localSettings.unsetDegreeBehavior

  // Phase 1: Setup
  const incompleteTasks = allTasks.filter(t => !t.completed)
  SchedulerLogger.log(`Starting auto-scheduler with ${incompleteTasks.length} incomplete tasks`)

  // Caches
  const incompletePresCache = new Map<number, TaskDepRef[]>()
  const incompletePostsCache = new Map<number, TaskDepRef[]>()
  const taskScheduleCache = new Map<number, Schedule | null>()

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

  // Determine if a dependency degree is "hard" (blocking)
  const isHardDegree = (degree: 1 | 2 | 3 | null): boolean => {
    if (degree === null) return unsetDegreeBehavior >= 2
    return degree >= 2
  }

  // Project depth computation (same as use-task-sorting.ts)
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
    const posts = x.grabPostreqs(true)
    if (posts.length === 0) {
      const result = { depth: -1, inprogress: false }
      associatedProjectDepth.set(x.id, result)
      return result
    }
    let minDepth = -1
    let hasInProgressAtMinDepth = false
    for (const y of posts) {
      const postResult = associatedProjectDepth.has(y.id)
        ? associatedProjectDepth.get(y.id)!
        : calculateAssociatedProjectDepth(y)
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

  // Inherited deadline computation
  const deadlineMemo = new Map<number, InheritedDeadlineResult | null>()
  const deadlineVisited = new Set<number>()

  // Task layers (prereq depth)
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

  // Star weight computation
  const starVisited = new Set<number>()
  incompleteTasks.forEach(t => taskStarredStore.computeDescendants(t.id, taskMap, starVisited))

  // Compute layers for all tasks
  incompleteTasks.forEach(computeLayer)

  // Resolve schedules and build timelines per unique schedule
  const now = new Date()
  const horizonDays = 90
  const timelineCache = new Map<number | 'fallback', ScheduleTimeline>()

  const getTimeline = (schedule: Schedule | null): ScheduleTimeline => {
    const key = schedule ? schedule.id : 'fallback'
    let timeline = timelineCache.get(key)
    if (!timeline) {
      const slots = generateTimeline(schedule, now, horizonDays)
      timeline = new ScheduleTimeline(slots)
      timelineCache.set(key, timeline)
    }
    return timeline
  }

  // Priority function (dynamic — depends on virtualTime)
  const computeTaskPriority = (
    task: Task,
    virtualTime: Date,
    placedTasks: Set<number>
  ): number => {
    const layer = taskLayers.get(task.id) ?? 0
    const layerWeight = (100 - layer) * 250

    const isStarred = taskStarredStore.isStarred(task.id) ? 2 : 0
    const descendantCount = taskStarredStore.getStarredDescendantCount(task.id) > 0 ? 1 : 0
    const starWeight = (isStarred + descendantCount) * 100

    const apdResult = associatedProjectDepth.get(task.id)
    const apd = apdResult?.depth ?? -1
    const projectLayerWeight = apd === -1 ? 300 : 250 - (apd * 50)
    const inProgressBonus = apdResult?.inprogress ? 50 : 0

    let dueDateBonus = 0
    const inherited = computeInheritedDeadline(task, deadlineMemo, deadlineVisited, defaultDuration)
    if (inherited) {
      const hoursRemaining = (inherited.deadline.getTime() - virtualTime.getTime()) / (1000 * 60 * 60)
      if (hoursRemaining > 0) {
        dueDateBonus = Math.min(100, 100 * Math.pow(0.5, hoursRemaining / 24))
      } else {
        // Past deadline — maximum urgency
        dueDateBonus = 100
      }
    }

    // Schedule bonus: 1000 if task's schedule is active at virtualTime
    let scheduleBonus = 0
    const taskSchedule = resolveTaskSchedule(task, scheduleRepo, listRepo, defaultSchedule, taskScheduleCache)
    if (taskSchedule) {
      const vDay: DayOfWeek = DAYS_OF_WEEK[virtualTime.getDay()]!
      const vTime = formatHHmm(virtualTime)
      if (taskSchedule.isActiveAt(vDay, vTime)) {
        scheduleBonus = 1000
      }
    } else {
      // Fallback schedule (9-5) — check if virtualTime is in 9-17
      const h = virtualTime.getHours()
      if (h >= 9 && h < 17) {
        scheduleBonus = 1000
      }
    }

    // Degree-1 bonus: +200 if all degree-1 prereqs are already placed
    let degree1Bonus = 0
    const pres = getIncompletePres(task)
    const degree1Pres = pres.filter(r => r.degree === 1)
    if (degree1Pres.length > 0 && degree1Pres.every(r => placedTasks.has(r.task.id))) {
      degree1Bonus = 200
    }

    return layerWeight + starWeight + projectLayerWeight + inProgressBonus + dueDateBonus + scheduleBonus + degree1Bonus
  }

  // Phase 2: Ready Queue Init
  // A task is "ready" when all HARD prereqs (degree 2/3/null-mapped) are placed
  const hardPrereqCount = new Map<number, number>() // count of hard incomplete prereqs
  const hardPrereqsSatisfied = new Map<number, number>() // how many have been placed
  const readyQueue: Task[] = []
  const placedTasks = new Set<number>()

  for (const task of incompleteTasks) {
    const pres = getIncompletePres(task)
    const hardPres = pres.filter(r => isHardDegree(r.degree))
    hardPrereqCount.set(task.id, hardPres.length)
    hardPrereqsSatisfied.set(task.id, 0)

    if (hardPres.length === 0) {
      readyQueue.push(task)
    }
  }

  // Phase 3: Greedy Forward Walk
  const scheduled: ScheduledItem[] = []
  const atRisk: AtRiskItem[] = []
  const maxIterations = 3 * incompleteTasks.length

  let iterations = 0
  while (readyQueue.length > 0 && iterations < maxIterations) {
    iterations++

    // Find the earliest virtual time across all ready tasks' timelines
    let earliestTime: Date | null = null
    for (const task of readyQueue) {
      const schedule = resolveTaskSchedule(task, scheduleRepo, listRepo, defaultSchedule, taskScheduleCache)
      const timeline = getTimeline(schedule)
      const nextStart = timeline.peekNextStart()
      if (nextStart && (!earliestTime || nextStart.getTime() < earliestTime.getTime())) {
        earliestTime = nextStart
      }
    }

    if (!earliestTime) break // no more time slots available

    // Score all ready tasks at this virtual time
    let bestTask: Task | null = null
    let bestScore = -Infinity
    let bestIndex = -1

    for (let i = 0; i < readyQueue.length; i++) {
      const task = readyQueue[i]!
      const score = computeTaskPriority(task, earliestTime, placedTasks)
      if (score > bestScore) {
        bestScore = score
        bestTask = task
        bestIndex = i
      }
    }

    if (!bestTask || bestIndex === -1) break

    // Remove from ready queue
    readyQueue.splice(bestIndex, 1)

    // Allocate time
    const duration = bestTask.task_duration_in_minutes ?? defaultDuration
    const schedule = resolveTaskSchedule(bestTask, scheduleRepo, listRepo, defaultSchedule, taskScheduleCache)
    const timeline = getTimeline(schedule)
    const allocation = timeline.allocate(duration)

    if (!allocation) {
      // No space left — this task is at-risk
      const inherited = computeInheritedDeadline(bestTask, deadlineMemo, deadlineVisited, defaultDuration)
      atRisk.push({
        task: bestTask,
        deadline: inherited?.deadline ?? new Date(0),
        reason: 'No available time slots in the scheduling horizon'
      })
      // Still mark as placed so dependents can proceed
      placedTasks.add(bestTask.id)
    } else {
      // Check deadline
      const inherited = computeInheritedDeadline(bestTask, deadlineMemo, deadlineVisited, defaultDuration)
      if (inherited && allocation.end.getTime() > inherited.deadline.getTime()) {
        atRisk.push({
          task: bestTask,
          deadline: inherited.deadline,
          reason: `Scheduled end ${formatHHmm(allocation.end)} exceeds deadline`
        })
      }

      scheduled.push({
        task: bestTask,
        startTime: allocation.start,
        endTime: allocation.end,
        durationMinutes: duration,
        scheduleTitle: schedule?.title ?? 'Default'
      })
      placedTasks.add(bestTask.id)
    }

    // Update postreq satisfaction
    for (const ref of getIncompletePosts(bestTask)) {
      const postId = ref.task.id
      if (!hardPrereqCount.has(postId)) continue

      // Only increment if THIS dependency is hard
      if (isHardDegree(ref.degree)) {
        const current = hardPrereqsSatisfied.get(postId) ?? 0
        const newCount = current + 1
        hardPrereqsSatisfied.set(postId, newCount)

        const total = hardPrereqCount.get(postId) ?? 0
        if (newCount >= total && !placedTasks.has(postId)) {
          readyQueue.push(ref.task)
        }
      }
    }
  }

  // Phase 4: Stuck tasks (cycles or unreachable)
  const notPlaced = incompleteTasks.filter(t => !placedTasks.has(t.id))
  if (notPlaced.length > 0) {
    SchedulerLogger.warn(`${notPlaced.length} tasks could not be scheduled (possible cycles)`)
  }

  const elapsed = performance.now() - startTime
  SchedulerLogger.log(`Auto-scheduler completed in ${elapsed.toFixed(1)}ms: ${scheduled.length} scheduled, ${atRisk.length} at-risk, ${notPlaced.length} stuck`)

  return { scheduled, atRisk }
}
