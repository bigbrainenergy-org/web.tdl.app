import { handleError, notifySuccess } from './notification-utils'
import { AllOptionalTaskProperties, CreateTaskOptions } from 'src/stores/tasks/task-interfaces-types'
import { useTaskStore } from 'src/stores/tasks/task-store'
import { Task } from 'src/stores/tasks/task-model'

// FIXME: This should (probably) return the task created
export function createTask(payload: CreateTaskOptions) {
  useTaskStore()
    .apiCreate(payload)
    .then(() => {
      notifySuccess('Successfully created a task')
    }, handleError('Failed to create task.'))
}

export function updateTask(id: number, options: AllOptionalTaskProperties) {
  useTaskStore()
    .apiUpdate(id, options)
    .then(() => {
      notifySuccess('Task Was Updated')
    }, handleError('Error updating task'))
}

export async function addPre(task: Task, newPreID: number) {
  console.log('addPre')
  const start = performance.now()
  return useTaskStore()
    .addRule(newPreID, task.id)
    .then(() => {
      const duration = performance.now() - start
      notifySuccess('Added Prerequisite', 'fa-solid fa-link')
      console.assert(
        duration < 800,
        `Adding a rule via API should ideally be faster than ${duration} ms`
      )
    }, handleError('Failed to add prereq'))
}

export async function addPost(task: Task, newPostID: number) {
  const start = performance.now()
  return useTaskStore()
    .addRule(task.id, newPostID)
    .then(() => {
      const duration = performance.now() - start
      notifySuccess('Added Postrequisite', 'fa-solid fa-link')
      console.assert(
        duration < 800,
        `Adding a postrequisite via API should ideally be faster than ${duration} ms`
      )
    }, handleError('Failed to add postreq'))
}

export function filterByList(tasks: Task[], listTitle: string): Task[] {
  // TODO this relationship is in the ORM so we can retrieve the related tasks by the List class
  if (listTitle === '') {
    return tasks
  } else {
    return tasks.filter((task) => task.list?.title === listTitle)
  }
}

export function filterByAgenda(baseQuery: Task[]): Task[] {
  const finalList = new Set<Task>()
  const queue: Map<number, Task[]> = new Map()
  const addedToQueue = new Set<number>()
  const safeAccess = (q: Map<number, Task[]>, key: number): Task[] => {
    if (typeof q.get(key) === 'undefined') q.set(key, [])
    return q.get(key)!
  }
  const enqueue = (tasks: Task[]) => {
    tasks.forEach((x) => {
      safeAccess(queue, x.incomplete_postreqs.length).push(x)
      addedToQueue.add(x.id)
    })
  }
  enqueue(baseQuery)
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
        console.warn('agenda calc is taking too long. bailing out. Also TODO')
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
            if (qk.length === 0) {
              queue.delete(k)
              qkeys.splice(i, 1)
            }
            const duration = performance.now() - start
            console.assert(duration < 8, 'agenda main loop is taking too long per task')
            bail = true
            break
          }
        }
        if (bail) break
      }
    }
  }
  return Array.from(finalList)
}

// TODO do I use this?
// - I shouldn't need to return; array.sort is in-place
export function sortByPostreqs(tasks: Task[], hideCompleted = true): Task[] {
  const postreqs = hideCompleted
    ? (t: Task) => t.hard_postreqs.filter((x) => !x.completed)
    : (t: Task) => t.hard_postreqs
  return tasks.sort((a, b) => postreqs(b).length - postreqs(a).length)
}
