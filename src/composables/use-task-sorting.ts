import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { dontLookAtMe } from 'src/stores/tasks/look-i-dont-make-the-rules'
import type { Task } from 'src/stores/tasks/task-model'
import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
import { useTaskStore } from 'src/stores/tasks/task-store'
import { stuckTasks } from 'src/stores/tasks/task-utils'
import { Logger } from 'src/utils/d'
import { errorNotification } from 'src/utils/notification-utils'
import { sortByPostreqs } from 'src/utils/task-utils'

const TaskSortingLogger = new Logger('Task Sort', '#794A20')

export function useTaskSorting() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentSortingMode, hideCompleted } = storeToRefs(localSettingsStore)

  function sortTasks(tasks: Task[]): Task[] {
    if (currentSortingMode.value === 'sortByPostreqs') {
      return sortByPostreqs(tasks, hideCompleted.value)
    } else if(currentSortingMode.value === 'sortByAgenda') {
      const ewww = dontLookAtMe()
      const taskStarredStore = useTaskStarredStore()
      const taskStore = useTaskStore()
      const taskMap = taskStore.mapp
      const timings: any = {
        agendaSort: performance.now(),
        computeDescendantsTotal: 0,
        registrationTotal: 0,
        insertionTotal: 0,
        prerequisiteCheckTotal: 0,
        incrementCounterTotal: 0,
        // Counters
        mainLoopIterations: 0,
        tasksChecked: 0,
        tasksProcessed: 0,
      }

      // Pre-filter tasks for better performance
      const filteredTasks = hideCompleted.value ? tasks.filter(x => !x.completed) : tasks
      const ptarr = filteredTasks.filter(x => x.notes?.includes('!PROJECT'))
      const projectids = ptarr.map(x => x.id)
      const projectTasks = new Set(projectids)
      const projectDepth = new Map<number, number>()

      // Cycle-safe project depth calculation
      const projectVisiting = new Set<number>()
      const calculateProjectDepth = (x: Task) => {
        if (projectDepth.has(x.id)) return projectDepth.get(x.id)!
        if (projectVisiting.has(x.id)) return 0 // cycle detected, break it
        projectVisiting.add(x.id)
        let depth = 0
        const pres = x.grabPrereqs(true)
        if(pres.length === 0) {
          projectDepth.set(x.id, depth)
          projectVisiting.delete(x.id)
          return depth
        }
        pres.forEach(y => {
          if(projectTasks.has(y.id)) {
            if(projectDepth.has(y.id)) {
              depth = Math.max(projectDepth.get(y.id)!, depth + 1)
            }
            else depth = Math.max(calculateProjectDepth(y), depth + 1)
          }
        })
        depth = Math.min(depth, 5)
        projectDepth.set(x.id, depth)
        projectVisiting.delete(x.id)
        return depth
      }

      ptarr.forEach(calculateProjectDepth)

      const associatedProjectDepth = new Map<number, number>()

      const calculateAssociatedProjectDepth = (x: Task): number => {
        if (associatedProjectDepth.has(x.id)) return associatedProjectDepth.get(x.id)!

        // Project tasks get their own project depth
        if (projectTasks.has(x.id)) {
          const depth = projectDepth.get(x.id) ?? 0
          associatedProjectDepth.set(x.id, depth)
          return depth
        }

        const posts = x.grabPostreqs(true)
        if (posts.length === 0) {
          associatedProjectDepth.set(x.id, -1)
          return -1
        }

        let minDepth = -1
        for (const y of posts) {
          const postDepth = associatedProjectDepth.has(y.id)
            ? associatedProjectDepth.get(y.id)!
            : calculateAssociatedProjectDepth(y)
          if (postDepth !== -1) {
            minDepth = minDepth === -1 ? postDepth : Math.min(minDepth, postDepth)
          }
        }

        associatedProjectDepth.set(x.id, minDepth)
        return minDepth
      }

      filteredTasks.forEach(calculateAssociatedProjectDepth)

      const finalList = new Map<number, Task>()
      const visited = new Set<number>()

      // Ready queue - tasks whose prerequisites are all satisfied, ready to process immediately
      const readyQueue: Task[] = []

      // Track layer/depth of each task (layer 0 = no prereqs, layer 1 = depends on layer 0, etc.)
      const taskLayers = new Map<number, number>()

      // Cache total incomplete prereqs count per task
      const totalIncompletePrereqs = new Map<number, number>()

      // Incremental prerequisite satisfaction tracking
      // Maps task ID -> count of how many incomplete prereqs are already in finalList
      const prereqsSatisfiedCount = new Map<number, number>()

      // Cache star weights to avoid recomputation during binary search
      const starWeightCache = new Map<number, number>()

      // Helper to calculate priority weight for a task (with caching)
      // Priority = (layer_weight * 250) + (star_weight * 100)
      // - Adjacent layers can swap based on stars (fuzzy)
      // - Layer n ALWAYS beats layer n+2+ (guaranteed by 500pt gap > 300pt max star weight)
      const getPriorityWeight = (task: Task): number => {
        const cached = starWeightCache.get(task.id)
        if (cached !== undefined) return cached

        const layer = taskLayers.get(task.id) ?? 0
        // Each layer is worth 250 points - allows high-priority layer n+1 to beat low-priority layer n
        const layerWeight = (100 - layer) * 250

        const isStarred = taskStarredStore.isStarred(task.id) ? 2 : 0
        const descendantCount = taskStarredStore.getStarredDescendantCount(task.id) > 0 ? 1 : 0
        const starWeight = (isStarred + descendantCount) * 100 // Max 300 points

        const apd = associatedProjectDepth.get(task.id) ?? -1
        // Depth is capped at 5, so apd * 50 ranges from 0-250; no need to clamp
        const projectLayerWeight = apd === -1 ? 300 : 250 - (apd * 50)

        const weight = layerWeight + starWeight + projectLayerWeight
        starWeightCache.set(task.id, weight)
        return weight
      }

      // Compute task layer based on max prereq layer + 1, then insert into ready queue
      const insertIntoReadyQueue = (queue: Task[], newTask: Task) => {
        const insertTime = performance.now()

        // Compute layer NOW, when all prereqs are guaranteed to be in finalList
        if (!taskLayers.has(newTask.id)) {
          const incompletePres = ewww.grabIncompletePres(newTask.id)
          let maxPrereqLayer = -1

          for (const preId of incompletePres.keys()) {
            const prereqLayer = taskLayers.get(preId) ?? 0
            maxPrereqLayer = Math.max(maxPrereqLayer, prereqLayer)
          }

          taskLayers.set(newTask.id, maxPrereqLayer + 1)
        }

        const newWeight = getPriorityWeight(newTask)

        // Binary search for insertion point (descending order - higher priority/lower layer first)
        let left = 0
        let right = queue.length

        while (left < right) {
          const mid = Math.floor((left + right) / 2)
          const midWeight = getPriorityWeight(queue[mid]!)

          if (midWeight >= newWeight) {
            left = mid + 1
          } else {
            right = mid
          }
        }

        queue.splice(left, 0, newTask)
        timings.insertionTotal += performance.now() - insertTime
      }

      // Pre-register ALL filteredTasks: initialize prereq counters and compute starred descendants.
      // This ensures every task is tracked even if not discovered via postreq BFS traversal,
      // which fixes stuck tasks caused by bidirectional data inconsistency.
      const registrationTime = performance.now()
      for (const task of filteredTasks) {
        taskStarredStore.computeDescendants(task.id, taskMap, visited)

        const incompletePres = ewww.grabIncompletePres(task.id)
        totalIncompletePrereqs.set(task.id, incompletePres.size)
        prereqsSatisfiedCount.set(task.id, 0)

        // Tasks with no incomplete prereqs are immediately ready
        if (incompletePres.size === 0) {
          insertIntoReadyQueue(readyQueue, task)
        }
      }
      timings.registrationTotal = performance.now() - registrationTime

      let hundos = 0
      const maxIterations = 3 * filteredTasks.length

      // Main sorting loop
      while (readyQueue.length > 0 && hundos < maxIterations) {
        hundos++
        timings.mainLoopIterations++

        // Pop task from ready queue
        const task = readyQueue.shift()!
        timings.tasksChecked++

        // Skip if already processed
        if (finalList.has(task.id)) continue

        const prereqCheckTime = performance.now()
        const totalPrereqs = totalIncompletePrereqs.get(task.id) ?? 0
        const satisfiedCount = prereqsSatisfiedCount.get(task.id) ?? 0

        // O(1) check: are all prerequisites satisfied?
        const allPresSatisfied = satisfiedCount === totalPrereqs
        timings.prerequisiteCheckTotal += performance.now() - prereqCheckTime

        if (allPresSatisfied) {
          timings.tasksProcessed++
          finalList.set(task.id, task)

          // Incrementally update counters for all postrequisites
          const incrementTime = performance.now()
          for (const [postId, postTask] of ewww.grabIncompletePosts(task.id)) {
            // Only update tasks we're tracking (in filteredTasks)
            if (!totalIncompletePrereqs.has(postId)) continue

            const currentCount = prereqsSatisfiedCount.get(postId) ?? 0
            const newCount = currentCount + 1
            prereqsSatisfiedCount.set(postId, newCount)

            // Check if this task just became ready (all prereqs satisfied)
            const postTotalPrereqs = totalIncompletePrereqs.get(postId) ?? 0
            if (newCount === postTotalPrereqs && !finalList.has(postId)) {
              insertIntoReadyQueue(readyQueue, postTask)
            }
          }
          timings.incrementCounterTotal += performance.now() - incrementTime
        } else {
          TaskSortingLogger.warn(`Task ${task.id} in ready queue but prereqs not satisfied: ${satisfiedCount}/${totalPrereqs}`)
        }
      }

      if (hundos >= maxIterations) {
        TaskSortingLogger.warn('Agenda sorting exceeded maximum iterations - bailing out')
        errorNotification(new Error('Agenda sorting exceeded maximum iterations - bailing out'), 'Agenda sorting exceeded maximum iterations')
      }

      // Check for stuck tasks (only within filteredTasks, not all incomplete tasks)
      const notInFinalArray = filteredTasks.filter(x => !finalList.has(x.id))
        .filter(x => !x.completed)
        .filter(x => ewww.grabIncompletePres(x.id).size > 0)

      stuckTasks.value.clear()
      if (notInFinalArray.length > 0) {
        TaskSortingLogger.warn(`${notInFinalArray.length} tasks not processed - potential cycle detected`)
        notInFinalArray.forEach(x => stuckTasks.value.add(x.id))
      }

      timings.agendaSort = performance.now() - timings.agendaSort
      TaskSortingLogger.log(`SORTTASK TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)

      return Array.from(finalList.values())
    } else {
      return tasks
    }
  }

  function sortRoutineTasks(tasks: Task[]): Task[] {
    if (currentSortingMode.value === 'sortByPostreqs') {
      return sortByPostreqs(tasks, hideCompleted.value)
    } else if(currentSortingMode.value === 'sortByAgenda') {
      const ewww = dontLookAtMe()
      
      // Pre-compute task IDs as Set for O(1) lookups
      const taskIds = new Set(tasks.map(x => x.id))
      
      // Find first layer - tasks with no prerequisites in this set
      const firstLayer = tasks.filter(x => 
        x.hard_prereq_ids.every(preId => !taskIds.has(preId))
      )

      const finalList = new Map<number, Task>()
      const addedToQueue = new Set<number>()
      const queue: Map<number, Task[]> = new Map()
      const sortedKeys: number[] = []
      
      const enqueue = (tasksToEnqueue: Task[]) => {
        for (const task of tasksToEnqueue) {
          const postCount = task.grabPostreqs(true).length
          
          if (!queue.has(postCount)) {
            queue.set(postCount, [])
            insertSorted(sortedKeys, postCount)
          }
          
          queue.get(postCount)!.push(task)
          addedToQueue.add(task.id)
        }
      }
      
      const insertSorted = (arr: number[], value: number) => {
        let left = 0, right = arr.length
        while (left < right) {
          const mid = Math.floor((left + right) / 2)
          if (arr[mid]! > value) left = mid + 1
          else right = mid
        }
        arr.splice(left, 0, value)
      }
      
      const removeKey = (arr: number[], value: number) => {
        const index = arr.indexOf(value)
        if (index !== -1) arr.splice(index, 1)
      }

      enqueue(firstLayer)
      
      let hundos = 0
      const maxIterations = 3 * tasks.length
      
      while (sortedKeys.length > 0 && hundos < maxIterations) {
        hundos++
        let processed = false
        
        for (let keyIndex = 0; keyIndex < sortedKeys.length; keyIndex++) {
          const postCount = sortedKeys[keyIndex]!
          const queuedTasks = queue.get(postCount)!
          
          for (let taskIndex = 0; taskIndex < queuedTasks.length; taskIndex++) {
            const task = queuedTasks[taskIndex]!
            
            // Check prerequisites efficiently
            const prereqs = task.grabPrereqs(false).filter(y => taskIds.has(y.id))
            const allPresSatisfied = prereqs.every(prereq => finalList.has(prereq.id))
            
            if (allPresSatisfied) {
              finalList.set(task.id, task)
              
              // Enqueue postrequisites efficiently
              const newTasks: Task[] = []
              for (const [postId, postTask] of ewww.grabIncompletePosts(task.id)) {
                if (!addedToQueue.has(postId) && taskIds.has(postId)) {
                  newTasks.push(postTask)
                }
              }
              
              if (newTasks.length > 0) {
                enqueue(newTasks)
              }
              
              // Remove efficiently
              queuedTasks[taskIndex] = queuedTasks[queuedTasks.length - 1]!
              queuedTasks.pop()
              
              processed = true
              break
            }
          }
          
          if (queuedTasks.length === 0) {
            queue.delete(postCount)
            removeKey(sortedKeys, postCount)
            keyIndex--
          }
          
          if (processed) break
        }
        
        if (!processed) break
      }
      
      if (hundos >= maxIterations) {
        TaskSortingLogger.warn('Routine task sorting exceeded maximum iterations')
      }

      const finalArray = Array.from(finalList.values())

      return finalArray
    } else {
      return tasks
    }
  }

  return { sortTasks, sortRoutineTasks }
}
