import {
  Notification as NotificationInterface,
  Task as TaskInterface
} from '../components/models'
import { DateTime } from 'luxon'

let Notifications: any = null

if (process.env.MODE === 'capacitor') {
  // @ts-ignore
  import('@capacitor/local-notifications').then(
    ({ LocalNotifications }) => {
      Notifications = LocalNotifications
    }
  )
}

export function scheduleNotifications(notifications: Array<NotificationInterface>) {
  if (process.env.MODE === 'capacitor') {
    Notifications.schedule({ notifications: notifications });
  } else {
    console.log('Progressive Web Apps don\'t support scheduled notifications. Sadge')
  }
}

// Confusing similarly named helper method. Good luck debugging. 😈
export function scheduleNotification(notification: NotificationInterface) {
  scheduleNotifications([notification])
}

export function scheduleTaskNotification(task: TaskInterface) {
  if (task.remind_me_at) {
    scheduleNotification({
      id: task.id,
      title: task.title,
      schedule: { at: DateTime.fromISO(task.remind_me_at).toJSDate() },
      group: 'tasks'
    })
  }
}

export function cancelTaskNotification(task: TaskInterface) {
  cancelNotification({ id: task.id })
}

export function cancelNotification(notification: NotificationInterface) {
  cancelNotifications([notification])
}

export function cancelNotifications(notifications: Array<NotificationInterface>) {
  if (process.env.MODE === 'capacitor') {
    Notifications.cancel({ notifications: notifications })
  } else {
    console.log('Progressive Web Apps don\'t support scheduled notifications. Sadge')
  }
}

export async function syncNotifications(store: any) {
  if (process.env.MODE === 'capacitor') {
    const previouslyScheduled = await Notifications.getPending()
    const currentlyScheduled = store.getters['tasks/tasksWithReminders'](store)
    const toBeCancelled = previouslyScheduled.notifications.filter(
      (notification: NotificationInterface) => {
        return !(
          currentlyScheduled.some(
            (task: TaskInterface) => {
              return notification.id === task.id
            }
          )
        )
      }
    ) // previouslyScheduled where not currentlyScheduled
    const toBeScheduled = currentlyScheduled.map(
      (task: TaskInterface) => {
        return {
          id: task.id,
          title: task.title,
          schedule: { at: DateTime.fromISO(task.remind_me_at).toJSDate() },
          group: 'tasks'
        }
      }
    )
    if (toBeCancelled.length > 0) {
      cancelNotifications(toBeCancelled)
    }
    if (toBeScheduled.length > 0) {
      scheduleNotifications(toBeScheduled)
    }
  }
}

// const createTasksChannel = (
//  () => {
//   let executed = false
//   return () => {
//     if (!executed) {
//       executed = true
//       const newChannel = LocalNotifications.createChannel({
//         id: 'tdl-app-tasks',
//         name: 'TDL App Tasks',
//         description: 'Tasks from TDL App',
//         sound: null,
//         vibration: false
//       })
//       console.log(newChannel)
//     }
//   }
//  }
// )()

// export function createTasksChannel() {
//   if (process.env.MODE === 'capacitor') {
//     const newChannel = Notifications.createChannel({
//       id: 'tdl-app-tasks',
//       name: 'TDL App Tasks',
//       description: 'Tasks from TDL App',
//       sound: 'tuturu.wav',
//       importance: 3,
//       vibration: false
//     })
//     console.log(newChannel)
//   }
// }
