import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import type { Task } from 'src/stores/tasks/task-model'
import { safeAccess } from 'src/utils/map-utils'
import { sortByPostreqs } from 'src/utils/task-utils'

export function useTaskSorting() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentSortingMode, hideCompleted } = storeToRefs(localSettingsStore)

  function sortTasks(tasks: Task[]): Task[] {
    if (currentSortingMode.value === 'sortByPostreqs') {
      return sortByPostreqs(tasks, hideCompleted.value)
    } else if(currentSortingMode.value === 'sortByAgenda') { // bug: currently adding and removing rules puts task store in an un-agendaable state. new as of use task sort directive
      /**
       * # firstLayer
       * The tasks that meet the following criteria:
       * - incomplete
       * - do not have incomplete prereqs
       * sorted by quantity of incomplete postreqs.
       * #todo is the sort necessary?
       */
      console.log({ hideCompleted: hideCompleted.value })
      const firstLayer = tasks.filter(x => (hideCompleted.value ? !x.completed : true) && x.incomplete_prereqs.length === 0).sort((a, b) => (b.task_duration_in_minutes ?? 1440) - (a.task_duration_in_minutes ?? 1440))
      console.debug({ firstLayer })
      /**
       * # finalList
       * It's important to note that JS Set and Map has the following properties:
       * - maintains insertion order
       * 
       * The final output of the agenda sort is:
       * 1. put together in this Map, then
       * 2. converted to an array.
       */
      const finalList = new Map<number, Task>()
      /**
       * # queue
       * A data structure that groups tasks together by qty of incomplete postreqs.
       * - key: a quantity of incomplete postreqs
       * - value: an array of enqueued Tasks that have that many incomplete postreqs.
       */
      const queue: Map<number, Task[]> = new Map()
      /**
       * # addedToQueue
       * A set of IDs of any task that has been added to the queue.
       * - number: Task ID
       */
      const addedToQueue = new Set<number>()
      /**
       * # enqueue
       * Take an array of tasks and push them into the queue map.
       * @param tasks an array of tasks to enqueue
       */
      const enqueue = (tasks: Task[]) => {
        tasks.forEach((x) => {
          safeAccess(queue, x.incomplete_postreqs.length).push(x)
          addedToQueue.add(x.id)
        })
      }
      enqueue(firstLayer)
      {
        /**
         * # qkeys
         * An array of just the keys of queue.
         * - The keys of queue represent the quantities of incomplete postreqs.
         * - The values of queue represent the Tasks that have that qty of incomplete postreqs.
         * 
         * This is a simple and effective way to get only the keys that have value in the Map.
         */
        let qkeys = Array.from(queue.keys())
        /**
         * # hundos
         * Simply a way to track the number of times certain functions have been run, to check performance and bail out if infinite loop is suspected.
         */
        let hundos = 0
        /**
         * # hasKeys
         * will determine if the agenda sorting loop should continue
         * @returns true if queue is still populated
         */
        const hasKeys = () => {
          const start = performance.now()
          qkeys = Array.from(queue.keys()).sort((a, b) => b - a)
          hundos++ // it's possible that valid max hundos will actually be tasks.length + 1
          const duration = performance.now() - start
          console.assert(duration < 10, 'checking keys took too long.')
          // console.debug({ qkeys, hundos })
          return qkeys.length > 0
        }
        while (hasKeys()) {
          /**
           * check if the loop has run an abnormal number of times relative to queue size
           */
          if (hundos > 2 * addedToQueue.size) { // bug: this is where it bails out after adding or removing a rule
            console.warn('agenda calc is taking too long. baling out. Add to TODOS')
            qkeys.forEach(x => {
              console.debug({ layer: queue.get(x) })
            })
            console.debug({ finalList: Array.from(finalList.values())})
            console.debug({ addedToQueue: Array.from(addedToQueue) })
            break
          }
          let bail = false
          const start = performance.now()
          /**
           * iterate the queue keys
           * - the queue keys are sorted desc
           */
          for (let i = 0; i < qkeys.length; i++) {
            /**
             * # k
             * This is the current qkey in the iteration. Again, the qkeys represent queue keys
             * - queue keys are an amount of incomplete postreqs that the value Tasks share
             */
            const k = qkeys[i]!
            /**
             * # qk
             * The Task[] value of the current queue key.
             * - guaranteed to be defined because safeAccess was used in the enqueue function.
             */
            const qk = queue.get(k)!
            qk.sort((a, b) => (a.task_duration_in_minutes ?? 1440) - (b.task_duration_in_minutes ?? 1440))
            /**
             * iterate the Tasks in queue at key k
             */
            for (let j = 0; j < qk.length; j++) {
              /**
               * # t
               * The Task at queue.get(qkeys[i])![j]
               * 
               * You really expect me to type that every time?
               */
              const t = qk[j]!
              /**
               * # ip
               * The incomplete postreqs of t
               * 
               * At this point I just like having Markdown annotations for everything
               */
              const ip = t.incomplete_prereqs
              /**
               * Check if every incomplete postreq has been sorted and 'staged'
               * - since we are iterating over the Task[] values of queue by incomplete postreqs qty (desc) we get the desired output:
               * 1. place the layer zero task with the most qty postreqs first in the finalList
               * 2. enqueue the rest (as well as the postreqs of finalList[0])
               * 3. sort the queue by qty postreqs
               * 4. place the next task (with the most qty postreqs in the queue) in the finalList
               * 
               * So, the output is the most 'important' task is listed as soon as all its dependencies have themselves been listed.
               */
              if (ip.every((y) => finalList.has(y.id))) {
                // console.debug(`adding task ${t.id} now!`)
                finalList.set(t.id, t)
                // enqueue the incomplete postreqs, but skip those who are already there.
                enqueue(t.incomplete_postreqs.filter((x) => !addedToQueue.has(x.id)))
                // remove the Task t, at qk[j]
                // TODO: ideally we need to decrement j here. see related TODO about decrement i too.
                qk.splice(j, 1) // trying decrement on i and j with no bail boolean
                // if that's the last element of the array, then prune the empty array from the queue Map
                if(qk.length === 0) {
                  queue.delete(k)
                  // TODO: ideally we need to decrement i here and maintain state of qkeys within the for loops.
                  // this would have to include adding to qkeys during the enqueue step.
                  qkeys.splice(i, 1)
                }
                // complain in the case of poor performance
                const duration = performance.now() - start
                console.assert(duration < 8, 'agenda main loop is taking too long per task')
                // TODO: remove this once qkeys and qk are properly managed in the for loops.
                bail = true
                break
              }
              else {
                // console.debug({ 'not adding': t.id, culprit: ip.filter(y => !finalList.has(y.id))[0].id, finalList: Array.from(finalList.values()) })
              }
            }
            if(bail) {
              break
            }
            else {
              // console.debug(`iterating i. i is ${i}`)
            }
          }
        }
      }
      return Array.from(finalList.values())
    } else {
      return tasks
    }
  }

  function sortRoutineTasks(tasks: Task[]): Task[] {
    if (currentSortingMode.value === 'sortByPostreqs') {
      return sortByPostreqs(tasks, hideCompleted.value)
    } else if(currentSortingMode.value === 'sortByAgenda') { // bug: currently adding and removing rules puts task store in an un-agendaable state. new as of use task sort directive
      /**
       * # firstLayer
       * The tasks that meet the following criteria:
       * - incomplete
       * - do not have incomplete prereqs
       * sorted by quantity of incomplete postreqs.
       * #todo is the sort necessary?
       */
      const ids = tasks.map(x => x.id)
      const firstLayer = tasks.filter(x => x.hard_prereq_ids.every(y => !ids.includes(y))).sort((a, b) => (b.task_duration_in_minutes ?? 1440) - (a.task_duration_in_minutes ?? 1440))
      console.debug({ firstLayer })
      /**
       * # finalList
       * It's important to note that JS Set and Map has the following properties:
       * - maintains insertion order
       * 
       * The final output of the agenda sort is:
       * 1. put together in this Map, then
       * 2. converted to an array.
       */
      const finalList = new Map<number, Task>()
      /**
       * # queue
       * A data structure that groups tasks together by qty of incomplete postreqs.
       * - key: a quantity of incomplete postreqs
       * - value: an array of enqueued Tasks that have that many incomplete postreqs.
       */
      const queue: Map<number, Task[]> = new Map()
      /**
       * # addedToQueue
       * A set of IDs of any task that has been added to the queue.
       * - number: Task ID
       */
      const addedToQueue = new Set<number>()
      /**
       * # enqueue
       * Take an array of tasks and push them into the queue map.
       * @param tasks an array of tasks to enqueue
       */
      const enqueue = (tasks: Task[]) => {
        tasks.forEach((x) => {
          safeAccess(queue, x.incomplete_postreqs.length).push(x)
          addedToQueue.add(x.id)
        })
      }
      enqueue(firstLayer)
      {
        /**
         * # qkeys
         * An array of just the keys of queue.
         * - The keys of queue represent the quantities of incomplete postreqs.
         * - The values of queue represent the Tasks that have that qty of incomplete postreqs.
         * 
         * This is a simple and effective way to get only the keys that have value in the Map.
         */
        let qkeys = Array.from(queue.keys())
        /**
         * # hundos
         * Simply a way to track the number of times certain functions have been run, to check performance and bail out if infinite loop is suspected.
         */
        let hundos = 0
        /**
         * # hasKeys
         * will determine if the agenda sorting loop should continue
         * @returns true if queue is still populated
         */
        const hasKeys = () => {
          const start = performance.now()
          qkeys = Array.from(queue.keys()).sort((a, b) => b - a)
          hundos++ // it's possible that valid max hundos will actually be tasks.length + 1
          const duration = performance.now() - start
          console.assert(duration < 10, 'checking keys took too long.')
          // console.debug({ qkeys, hundos })
          return qkeys.length > 0
        }
        while (hasKeys()) {
          /**
           * check if the loop has run an abnormal number of times relative to queue size
           */
          if (hundos > 2 * addedToQueue.size) { // bug: this is where it bails out after adding or removing a rule
            console.warn('agenda calc is taking too long. baling out. Add to TODOS')
            qkeys.forEach(x => {
              console.debug({ layer: queue.get(x) })
            })
            console.debug({ finalList: Array.from(finalList.values())})
            console.debug({ addedToQueue: Array.from(addedToQueue) })
            break
          }
          let bail = false
          const start = performance.now()
          /**
           * iterate the queue keys
           * - the queue keys are sorted desc
           */
          for (let i = 0; i < qkeys.length; i++) {
            /**
             * # k
             * This is the current qkey in the iteration. Again, the qkeys represent queue keys
             * - queue keys are an amount of incomplete postreqs that the value Tasks share
             */
            const k = qkeys[i]!
            /**
             * # qk
             * The Task[] value of the current queue key.
             * - guaranteed to be defined because safeAccess was used in the enqueue function.
             */
            const qk = queue.get(k)!
            qk.sort((a, b) => (a.task_duration_in_minutes ?? 1440) - (b.task_duration_in_minutes ?? 1440))
            /**
             * iterate the Tasks in queue at key k
             */
            for (let j = 0; j < qk.length; j++) {
              /**
               * # t
               * The Task at queue.get(qkeys[i])![j]
               * 
               * You really expect me to type that every time?
               */
              const t = qk[j]!
              /**
               * # ip
               * The incomplete postreqs of t
               * 
               * At this point I just like having Markdown annotations for everything
               */
              const ip = t.hard_prereqs.filter(y => ids.includes(y.id))
              /**
               * Check if every incomplete postreq has been sorted and 'staged'
               * - since we are iterating over the Task[] values of queue by incomplete postreqs qty (desc) we get the desired output:
               * 1. place the layer zero task with the most qty postreqs first in the finalList
               * 2. enqueue the rest (as well as the postreqs of finalList[0])
               * 3. sort the queue by qty postreqs
               * 4. place the next task (with the most qty postreqs in the queue) in the finalList
               * 
               * So, the output is the most 'important' task is listed as soon as all its dependencies have themselves been listed.
               */
              if (ip.every((y) => finalList.has(y.id))) {
                // console.debug(`adding task ${t.id} now!`)
                finalList.set(t.id, t)
                // enqueue the incomplete postreqs, but skip those who are already there.
                enqueue(t.hard_postreqs.filter((x) => !addedToQueue.has(x.id) && ids.includes(x.id)))
                // remove the Task t, at qk[j]
                // TODO: ideally we need to decrement j here. see related TODO about decrement i too.
                qk.splice(j, 1) // trying decrement on i and j with no bail boolean
                // if that's the last element of the array, then prune the empty array from the queue Map
                if(qk.length === 0) {
                  queue.delete(k)
                  // TODO: ideally we need to decrement i here and maintain state of qkeys within the for loops.
                  // this would have to include adding to qkeys during the enqueue step.
                  qkeys.splice(i, 1)
                }
                // complain in the case of poor performance
                const duration = performance.now() - start
                console.assert(duration < 8, 'agenda main loop is taking too long per task')
                // TODO: remove this once qkeys and qk are properly managed in the for loops.
                bail = true
                break
              }
              else {
                // console.debug({ 'not adding': t.id, culprit: ip.filter(y => !finalList.has(y.id))[0].id, finalList: Array.from(finalList.values()) })
              }
            }
            if(bail) {
              break
            }
            else {
              // console.debug(`iterating i. i is ${i}`)
            }
          }
        }
      }
      return Array.from(finalList.values())
    } else {
      return tasks
    }
  }

  return { sortTasks, sortRoutineTasks }
}
