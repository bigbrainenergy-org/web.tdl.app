import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { Task } from 'src/stores/tasks/task-model'
import { sortByPostreqs } from 'src/utils/task-utils'

export function useTaskSorting() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentSortingMode, hideCompleted } = storeToRefs(localSettingsStore)

  function sortTasks(tasks: Task[]): Task[] {
    if (currentSortingMode.value === 'sortByPostreqs') {
      return sortByPostreqs(tasks, hideCompleted.value)
    } else if(currentSortingMode.value === 'sortByAgenda') {
      const firstLayer = tasks.filter(x => !x.completed && x.incomplete_prereqs.length === 0)
      firstLayer.sort((a, b) => b.incomplete_postreqs.length - a.incomplete_postreqs.length)
      const finalList = new Set<Task>()
      const queue: Map<number, Task[]> = new Map()
      const addedToQueue = new Set<number>()
      const safeAccess = (q: Map<number, Task[]>, key: number): Task[] => {
        if(typeof q.get(key) === 'undefined') q.set(key, [])
        return q.get(key)!
      }
      const enqueue = (tasks: Task[]) => {
        tasks.forEach((x) => {
          safeAccess(queue, x.incomplete_postreqs.length).push(x)
          addedToQueue.add(x.id)
        })
      }
      enqueue(firstLayer)
      {
        let qkeys = Array.from(queue.keys())
        let hundos = 0
        const hasKeys = () => {
          const start = performance.now()
          qkeys = Array.from(queue.keys()).sort((a, b) => b - a)
          hundos++
          const duration = performance.now() - start
          console.assert(duration < 10, 'checking keys took too long.')
          return qkeys.length > 0
        }
        while (hasKeys()) {
          if (hundos > 4 * addedToQueue.size) {
            console.warn('agenda calc is taking too long. baling out. Add to TODOS')
            break
          }
          let bail = false
          const start = performance.now()
          for (let i = 0; i < qkeys.length; i++) {
            const k = qkeys[i]
            const qk = queue.get(k)!
            for (let j = 0; j < qk.length; j++) {
              const t = qk[j]
              const ip = t.incomplete_prereqs
              if (ip.every((y) => finalList.has(y))) {
                finalList.add(t)
                enqueue(t.incomplete_postreqs.filter((x) => !addedToQueue.has(x.id)))
                qk.splice(j, 1)
                if(qk.length === 0) {
                  queue.delete(k)
                  qkeys.splice(i, 1)
                }
                const duration = performance.now() - start
                console.assert(duration < 8, 'agenda main loop is taking too long per task')
                bail = true
                break
              }
            }
            if(bail) break
          }
        }
      }
      return Array.from(finalList)
    } else {
      return tasks
    }
  }

  return { sortTasks }
}
