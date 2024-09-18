import { AxiosError } from 'axios'
import { Notify } from 'quasar'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { λ } from './types'
import { Task } from 'src/stores/tasks/task-model'

export function errorNotification(error: Error | AxiosError, fallbackMessage: string) {
  const errorMessage = `${fallbackMessage}: ${error.message}`
  console.warn(errorMessage, error)

  Notify.create({
    color: 'negative',
    position: 'top',
    message: errorMessage,
    icon: 'report_problem',
    timeout: useLocalSettingsStore().notificationSpeed * 1500
  })

  return null
}

export function notifyUpdatedCompletionStatus(task: Task) {
  console.log(
    `notifyUpdatedCompletionStatus: task is ${task.completed ? 'completed' : 'incomplete'}`
  )
  Notify.create({
    message: `Marked "${task.title}" ${task.completed ? 'Complete' : 'Incomplete'}`,
    color: 'positive',
    position: 'top',
    icon: 'fa-solid fa-check',
    actions: [
      {
        label: 'Undo',
        color: 'white',
        handler: () => {
          task.toggleCompleted()
        }
      }
    ],
    timeout: useLocalSettingsStore().notificationSpeed * 1500
  })
  return task
}

export function gracefulError(error: Error | AxiosError, memo = 'Error') {
  return errorNotification(error, memo)
}

export function handleError(memo: string): λ<Error | AxiosError, null> {
  return (error: Error | AxiosError) => {
    console.warn(error)
    errorNotification(error, memo)
    return null
  }
}
export function notifySuccess(memo?: string, icon?: string) {
  return Notify.create({
    color: 'positive',
    position: 'top',
    message: memo ?? 'I am so happy',
    icon: icon ?? 'fa-solid fa-link',
    timeout: useLocalSettingsStore().notificationSpeed * 1500
  })
}
export function handleSuccess(memo?: string, icon?: string): λ {
  return () => notifySuccess(memo, icon)
}
