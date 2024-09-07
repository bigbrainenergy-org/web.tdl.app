import { useRepo } from 'pinia-orm'
import { cachedTask } from 'src/stores/performance/all-tasks'
import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task'
import { TDLAPP } from 'src/TDLAPP'
import { Utils } from 'src/util'

export function createTask(payload: CreateTaskOptions) {
  const tasksRepo = useRepo(TaskRepo)
  tasksRepo.addAndCache(payload).then(() => {
    Utils.notifySuccess('Successfully created a task')
  }, Utils.handleError('Failed to create task.'))
}

export async function updateTaskCompletedStatus(task: Task) {
  const tasksRepo = useRepo(TaskRepo)
  const newStatus = task.completed
  // TODO: strip payload object of everything except necessary
  await tasksRepo.updateAndCache({ id: task.id, payload: { task } }).then((t) => {
    // console.debug({ 'Tasks updateTaskCompletedStatus': t })
    if (t.completed !== newStatus)
      throw new Error('updated value and value meant to update do not match')
    TDLAPP.notifyUpdatedCompletionStatus(task)
  }, Utils.handleError('Error updating completion status of a task.'))
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

