import { useRepo } from 'pinia-orm'
import { cachedTask } from 'src/stores/performance/all-tasks'
import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task'
import { timeThisAABAsync } from './performance-utils'
import { handleError, handleSuccess, notifySuccess, notifyUpdatedCompletionStatus } from './notification-utils'

export function createTask(payload: CreateTaskOptions) {
  const tasksRepo = useRepo(TaskRepo)
  tasksRepo.addAndCache(payload).then(() => {
    notifySuccess('Successfully created a task')
  }, handleError('Failed to create task.'))
}

export async function addPre(task: Task, newPreID: number) {
  console.log('addPre')
  await timeThisAABAsync(
    useRepo(TaskRepo).addPre,
    'repo add pre function',
    1000
  )(task, newPreID).then(() => {
    // console.log('successfully added pre.')
    notifySuccess('Added Prerequisite', 'fa-solid fa-link')
  }, handleError('Failed to add prereq'))
}

export async function addPost(task: Task, newPostID: number) {
  await useRepo(TaskRepo)
    .addPost(task, newPostID)
    .then(
      handleSuccess('Added Postrequisite', 'fa-solid fa-link'),
      handleError('Failed to add postreq')
    )
}

export async function updateTaskCompletedStatus(task: Task) {
  const tasksRepo = useRepo(TaskRepo)
  const newStatus = task.completed
  // TODO: strip payload object of everything except necessary
  await tasksRepo.updateAndCache({ id: task.id, payload: { task } }).then((t) => {
    // console.debug({ 'Tasks updateTaskCompletedStatus': t })
    if (t.completed !== newStatus)
      throw new Error('updated value and value meant to update do not match')
    notifyUpdatedCompletionStatus(task)
  }, handleError('Error updating completion status of a task.'))
}

export function filterByList(tasks: cachedTask[], listTitle: string): cachedTask[] {
  if(listTitle === '') {
    return tasks
  } else {
    return tasks.filter(
      (task) => task.t.list?.title === listTitle
    )
  }
}

export function sortByPostreqs(tasks: cachedTask[], hideCompleted = true): cachedTask[] {
  const postreqs = hideCompleted
    ? (t: cachedTask) => t.hard_postreqs.filter((x) => !x.completed)
    : (t: cachedTask) => t.hard_postreqs
  return tasks.sort(
    (a, b) => postreqs(b).length - postreqs(a).length
  )
}
