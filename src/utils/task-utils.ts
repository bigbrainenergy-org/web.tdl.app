import { handleError, handleSuccess, notifySuccess } from './notification-utils'
import { CreateTaskOptions } from 'src/stores/tasks/task-interfaces-types'
import { useTaskStore } from 'src/stores/tasks/task-store'
import { Task } from 'src/stores/tasks/task-model'

export function createTask(payload: CreateTaskOptions) {
  useTaskStore()
    .apiCreate(payload)
    .then(() => {
      notifySuccess('Successfully created a task')
    }, handleError('Failed to create task.'))
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

export async function updateTaskCompletedStatus(task: Task) {
  const ts = useTaskStore()
  const newStatus = task.completed
  // TODO: strip payload object of everything except necessary
  await ts
    .apiUpdate(task.id, task)
    .then(
      handleSuccess(`Marked Task ${newStatus ? 'Complete' : 'Incomplete'}`),
      handleError('Error updating completion status of a task.')
    )
}

export function filterByList(tasks: Task[], listTitle: string): Task[] {
  // TODO this relationship is in the ORM so we can retrieve the related tasks by the List class
  if (listTitle === '') {
    return tasks
  } else {
    return tasks.filter((task) => task.list?.title === listTitle)
  }
}

// TODO do I use this?
// - I shouldn't need to return; array.sort is in-place
export function sortByPostreqs(tasks: Task[], hideCompleted = true): Task[] {
  const postreqs = hideCompleted
    ? (t: Task) => t.hard_postreqs.filter((x) => !x.completed)
    : (t: Task) => t.hard_postreqs
  return tasks.sort((a, b) => postreqs(b).length - postreqs(a).length)
}
