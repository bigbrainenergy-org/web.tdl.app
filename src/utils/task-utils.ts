import { useRepo } from 'pinia-orm'
import { CreateTaskOptions, TaskRepo } from 'src/stores/tasks/task'
import { Utils } from 'src/util'

export function createTask(payload: CreateTaskOptions) {
  const tr = useRepo(TaskRepo)
  tr.addAndCache(payload).then(() => {
    Utils.notifySuccess('Successfully created a task')
  }, Utils.handleError('Failed to create task.'))
}
