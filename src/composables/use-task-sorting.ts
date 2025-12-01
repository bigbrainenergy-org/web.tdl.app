import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { dontLookAtMe } from 'src/stores/tasks/look-i-dont-make-the-rules'
import type { Task } from 'src/stores/tasks/task-model'
import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
import { useTaskStore } from 'src/stores/tasks/task-store'
import { mostSuspiciousStuckTasks, stuckTasks } from 'src/stores/tasks/task-utils'
import { Logger } from 'src/utils/d'
import { safeAccess } from 'src/utils/map-utils'
import { errorNotification } from 'src/utils/notification-utils'
import { sortByPostreqs } from 'src/utils/task-utils'

const TaskSortingLogger = new Logger('Task Sort', '#794A20')

export function useTaskSorting() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentSortingMode, hideCompleted } = storeToRefs(localSettingsStore)
  const { busy } = storeToRefs(useLoadingStateStore())

  function sortTasks(tasks: Task[]): Task[] {
    if (currentSortingMode.value === 'sortByPostreqs') {
      return sortByPostreqs(tasks, hideCompleted.value)
    } else if(currentSortingMode.value === 'sortByAgenda') {
      // if(busy.value) {
      //   TaskSortingLogger.log('zzz')
      //   return tasks
      // }

      console.log('sorting.')
      
      const ewww = dontLookAtMe()
      const taskStarredStore = useTaskStarredStore()
      const taskStore = useTaskStore()
      const taskMap = taskStore.mapp
      const totalIncompleteTasks = taskStore.incompleteOnly.value.length
      const timings: any = {
        agendaSort: performance.now(),
        computeDescendantsTotal: 0,
        enqueueTimeTotal: 0,
        enqueueLayerCalc: 0,
        enqueueInitialCount: 0,
        insertionTotal: 0,
        prerequisiteCheckTotal: 0,
        incrementCounterTotal: 0,
        hasKeysTotal: 0,
        // Counters
        mainLoopIterations: 0,
        tasksChecked: 0,
        tasksProcessed: 0,
        tasksEnqueued: 0,
      }

      // Pre-filter tasks for better performance
      const filteredTasks = hideCompleted.value ? tasks.filter(x => !x.completed) : tasks

      // Find first layer tasks (no incomplete prerequisites)
      const firstLayer = filteredTasks.filter(x => ewww.grabIncompletePres(x.id).size === 0)
        .sort((a, b) => (b.task_duration_in_minutes ?? 1440) - (a.task_duration_in_minutes ?? 1440))

      const finalList = new Map<number, Task>()
      const addedToQueue = new Set<number>()
      const visited = new Set<number>()

      // Use more efficient queue structure with sorted keys maintained
      const queue: Map<number, Task[]> = new Map()
      const sortedKeys: number[] = []

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

        const weight = layerWeight + starWeight
        starWeightCache.set(task.id, weight)
        return weight
      }

      // Binary search insertion by priority weight (O(log n))
      const insertTaskByPriority = (queuedTasks: Task[], newTask: Task) => {
        const insertTime = performance.now()
        const newWeight = getPriorityWeight(newTask)

        // Binary search for insertion point (descending order - higher weight first)
        let left = 0
        let right = queuedTasks.length

        while (left < right) {
          const mid = Math.floor((left + right) / 2)
          const midWeight = getPriorityWeight(queuedTasks[mid]!)

          if (midWeight >= newWeight) {
            left = mid + 1
          } else {
            right = mid
          }
        }

        queuedTasks.splice(left, 0, newTask)
        timings.insertionTotal += performance.now() - insertTime
      }

      // Compute task layer based on max prereq layer + 1, then insert into ready queue
      const computeLayerAndInsertIntoReadyQueue = (queue: Task[], newTask: Task) => {
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

      const enqueue = (tasks: Task[]) => {
        let enqueuetime = performance.now()
        for (const task of tasks) {
          timings.tasksEnqueued++

          // Initialize tracking for this task (don't compute layer yet - that happens at ready queue entry)
          if (!totalIncompletePrereqs.has(task.id)) {
            const layerCalcTime = performance.now()
            const incompletePres = ewww.grabIncompletePres(task.id)
            const totalPrereqs = incompletePres.size
            totalIncompletePrereqs.set(task.id, totalPrereqs)
            timings.enqueueLayerCalc += performance.now() - layerCalcTime

            // Count how many prereqs are already satisfied
            const initialCountTime = performance.now()
            let initialSatisfiedCount = 0
            for (const preId of incompletePres.keys()) {
              // Check if this prereq is already in finalList
              if (finalList.has(preId)) {
                initialSatisfiedCount++
              }
            }
            timings.enqueueInitialCount += performance.now() - initialCountTime

            // Initialize prereq satisfied counter
            prereqsSatisfiedCount.set(task.id, initialSatisfiedCount)

            // If all prereqs already satisfied, compute layer and add to ready queue
            if (initialSatisfiedCount === totalPrereqs) {
              computeLayerAndInsertIntoReadyQueue(readyQueue, task)
            }
          }

          const postCount = ewww.grabIncompletePosts(task.id).size

          if (!queue.has(postCount)) {
            queue.set(postCount, [])
            insertSorted(sortedKeys, postCount)
          }

          // Insert task in priority order with binary search
          insertTaskByPriority(queue.get(postCount)!, task)
          addedToQueue.add(task.id)
          const computeDescendantsTime = performance.now()
          taskStarredStore.computeDescendants(task.id, taskMap, visited)
          timings.computeDescendantsTotal += performance.now() - computeDescendantsTime
        }
        enqueuetime = performance.now() - enqueuetime
        timings.enqueueTimeTotal += enqueuetime
      }
      
      // Helper function to insert key in sorted position (O(log n) with binary search)
      const insertSorted = (arr: number[], value: number) => {
        let left = 0, right = arr.length
        while (left < right) {
          const mid = Math.floor((left + right) / 2)
          if (arr[mid]! > value) left = mid + 1
          else right = mid
        }
        arr.splice(left, 0, value)
      }
      
      // Remove key from sorted array efficiently
      const removeKey = (arr: number[], value: number) => {
        const index = arr.indexOf(value)
        if (index !== -1) arr.splice(index, 1)
      }

      enqueue(firstLayer)
      
      let hundos = 0
      const maxIterations = 3 * useTaskStore().array.length
      
      // Main sorting loop - optimized with ready queue
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
            const currentCount = prereqsSatisfiedCount.get(postId) ?? 0
            const newCount = currentCount + 1
            prereqsSatisfiedCount.set(postId, newCount)

            // Check if this task just became ready (all prereqs satisfied)
            const totalPrereqs = totalIncompletePrereqs.get(postId) ?? 0
            if (newCount === totalPrereqs) {
              // Compute layer and add to ready queue now that all prereqs are in finalList
              computeLayerAndInsertIntoReadyQueue(readyQueue, postTask)
            }
          }
          timings.incrementCounterTotal += performance.now() - incrementTime

          const newTasks: Task[] = []
          for (const [postId, postTask] of ewww.grabIncompletePosts(task.id)) {
            if (!addedToQueue.has(postId)) {
              newTasks.push(postTask)
            }
          }

          if (newTasks.length > 0) {
            enqueue(newTasks)
          }
        } else {
          // Task not ready - this shouldn't happen with ready queue, but handle gracefully
          TaskSortingLogger.warn(`Task ${task.id} in ready queue but prereqs not satisfied: ${satisfiedCount}/${totalPrereqs}`)
        }
      }

      if (hundos >= maxIterations) {
        TaskSortingLogger.warn('Agenda sorting exceeded maximum iterations - bailing out')
        errorNotification(new Error('Agenda sorting exceeded maximum iterations - bailing out'), 'Agenda sorting exceeded maximum iterations')
      }

      // Check for stuck tasks
      const { incompleteOnly } = useTaskStore()
      const notInFinalArray = incompleteOnly.value.filter(x => !finalList.has(x.id))
        .filter(x => !x.completed)
        .filter(x => ewww.grabIncompletePres(x.id).size > 0)

      if (notInFinalArray.length > 0) {
        TaskSortingLogger.warn(`${notInFinalArray.length} tasks not processed - potential cycle detected`)
        stuckTasks.value.clear()
        notInFinalArray.forEach(x => stuckTasks.value.add(x.id))
      }
      
      timings.agendaSort = performance.now() - timings.agendaSort
      TaskSortingLogger.log(`OPTIMIZED SORTTASK TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)

      const finalArray = Array.from(finalList.values())

      // useTaskStarredStore()._starredIds.forEach(x => {
      //   const t = taskMap.get(x)
      //   //console.log(`${t?.title} (${t?.completed ? 'completed' : 'not completed'}): ${finalArray.map(y => y.id).indexOf(x)}`)
      // })
      
      return finalArray
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
