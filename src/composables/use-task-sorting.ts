import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { dontLookAtMe } from 'src/stores/tasks/look-i-dont-make-the-rules'
import type { Task } from 'src/stores/tasks/task-model'
import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
import { useTaskStore } from 'src/stores/tasks/task-store'
import { stuckTasks } from 'src/stores/tasks/task-utils'
import { Logger } from 'src/utils/d'
import { safeAccess } from 'src/utils/map-utils'
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
      if(busy.value) {
        TaskSortingLogger.log('zzz')
        return tasks
      }
      
      const ewww = dontLookAtMe()
      const taskStarredStore = useTaskStarredStore()
      const taskStore = useTaskStore()
      const taskMap = taskStore.mapp
      const totalIncompleteTasks = taskStore.incompleteOnly.value.length
      const timings: any = {
        agendaSort: performance.now(),
        computeDescendantsTotal: 0,
        enqueueTimeTotal: 0,
        hasKeysTotal: 0,
      }

      // Pre-filter tasks for better performance
      const filteredTasks = hideCompleted.value ? tasks.filter(x => !x.completed) : tasks
      const taskIds = new Set(filteredTasks.map(x => x.id)) // Use Set for O(1) lookups
      
      // Find first layer tasks (no incomplete prerequisites)
      const firstLayer = filteredTasks.filter(x => ewww.grabIncompletePres(x.id).size === 0)
        .sort((a, b) => (b.task_duration_in_minutes ?? 1440) - (a.task_duration_in_minutes ?? 1440))

      const finalList = new Map<number, Task>()
      const addedToQueue = new Set<number>()
      const visited = new Set<number>()
      
      // Use more efficient queue structure with sorted keys maintained
      const queue: Map<number, Task[]> = new Map()
      const sortedKeys: number[] = []
      
      // Cache star weights to avoid recomputation during binary search
      const starWeightCache = new Map<number, number>()
      
      // Helper to calculate star weight for a task (with caching)
      const getStarWeight = (task: Task): number => {
        const cached = starWeightCache.get(task.id)
        if (cached !== undefined) return cached
        
        const isStarred = taskStarredStore.isStarred(task.id) ? 2 : 0
        const descendantCount = taskStarredStore.getStarredDescendantCount(task.id) > 0 ? 1 : 0
        const weight = isStarred + descendantCount // Higher weight = higher priority
        
        starWeightCache.set(task.id, weight)
        return weight
      }
      
      // Helper to insert task in priority order within a queue level
      const insertTaskByPriority = (queuedTasks: Task[], newTask: Task) => {
        const newWeight = getStarWeight(newTask)
        
        // Simple linear insertion for now to ensure correctness
        // TODO: Optimize back to binary search once working correctly
        let insertIndex = 0
        for (let i = 0; i < queuedTasks.length; i++) {
          const existingWeight = getStarWeight(queuedTasks[i]!)
          if (existingWeight < newWeight) {
            insertIndex = i
            break
          }
          insertIndex = i + 1
        }
        queuedTasks.splice(insertIndex, 0, newTask)
      }

      const enqueue = (tasks: Task[]) => {
        let enqueuetime = performance.now()
        for (const task of tasks) {
          const postCount = ewww.grabIncompletePosts(task.id).size
          
          if (!queue.has(postCount)) {
            queue.set(postCount, [])
            insertSorted(sortedKeys, postCount)
          }
          
          // Insert task in priority order instead of just pushing
          insertTaskByPriority(queue.get(postCount)!, task)
          //queue.get(postCount)!.push(task) //testing raw push
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
      
      // Main sorting loop - optimized
      while (sortedKeys.length > 0 && hundos < maxIterations) {
        hundos++
        let processed = false

        let task: Task | null = null
        
        // Process keys in descending order (already sorted)
        for (let keyIndex = 0; keyIndex < sortedKeys.length; keyIndex++) {
          const postCount = sortedKeys[keyIndex]!
          const queuedTasks = queue.get(postCount)!
          
          // Process tasks in this queue level
          for (let taskIndex = 0; taskIndex < queuedTasks.length; taskIndex++) {
            task = queuedTasks[taskIndex]!
            const incompletePres = ewww.grabIncompletePres(task.id)
            
            // Check if all prerequisites are satisfied (optimized)
            let allPresSatisfied = true
            for (const preId of incompletePres.keys()) {
              if (!finalList.has(preId)) {
                allPresSatisfied = false
                break
              }
            }
            
            if (allPresSatisfied) {
              finalList.set(task.id, task)
              
              const newTasks: Task[] = []
              for (const [postId, postTask] of ewww.grabIncompletePosts(task.id)) {
                if (!addedToQueue.has(postId)) {
                  newTasks.push(postTask)
                }
              }
              
              if (newTasks.length > 0) {
                enqueue(newTasks)
              }
              
              // Remove task from queue while preserving sorted order
              queuedTasks.splice(taskIndex, 1)
              taskIndex-- // Adjust index after removal
              
              processed = true
              break // Process one task per iteration for stability
            }
          }
          
          // Clean up empty queue levels
          if (queuedTasks.length === 0) {
            queue.delete(postCount)
            removeKey(sortedKeys, postCount)
            keyIndex-- // Adjust index after removal
          }
          
          if (processed) break
        }
        
        if (!processed) {
          TaskSortingLogger.warn('No progress made in sorting iteration - potential cycle detected')
          const notInFinalArray = useTaskStore().incompleteOnly.value.filter(x => !finalList.has(x.id))
          if(task !== null) {
            //console.log(`task ${task.title} is not null`)
            stuckTasks.value.add(task.id)
            //console.log([...stuckTasks.value.values()])
          }
          // else {
          //   //console.log('task is null')
          // }
          notInFinalArray.forEach(x => stuckTasks.value.add(x.id))
          //console.log('not in final array', notInFinalArray.map(x => x.title))
          break
        }
      }
      
      if (hundos >= maxIterations) {
        TaskSortingLogger.warn('Agenda sorting exceeded maximum iterations - bailing out')
      }
      
      timings.agendaSort = performance.now() - timings.agendaSort
      TaskSortingLogger.log(`OPTIMIZED SORTTASK TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)

      const finalArray = Array.from(finalList.values())

      useTaskStarredStore()._starredIds.forEach(x => {
        const t = taskMap.get(x)
        //console.log(`${t?.title} (${t?.completed ? 'completed' : 'not completed'}): ${finalArray.map(y => y.id).indexOf(x)}`)
      })
      
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
