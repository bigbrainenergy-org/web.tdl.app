import { Task } from '../stores/tasks/task'
import { Notification as NotificationInterface } from 'src/models/Notification'
import { DateTime } from 'luxon'

let Notifications: any = null

if (process.env.MODE === 'capacitor') {
  import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
    Notifications = LocalNotifications
  })
}

export function scheduleNotifications(notifications: Array<NotificationInterface>) {
  if (process.env.MODE === 'capacitor') {
    Notifications.schedule({ notifications: notifications })
  } else {
    console.log("Progressive Web Apps don't support scheduled notifications. Sadge")
  }
}

// Confusing similarly named helper method. Good luck debugging. 😈
export function scheduleNotification(notification: NotificationInterface) {
  scheduleNotifications([notification])
}

export function scheduleTaskNotification(task: Task) {
  if (task.id === null) return
  if (task.remind_me_at) {
    scheduleNotification({
      id: task.id,
      title: task.title,
      schedule: { at: DateTime.fromISO(task.remind_me_at).toJSDate() },
      group: 'tasks'
    })
  }
}

export function cancelTaskNotification(task: Task) {
  if (task.id === null) return
  cancelNotification({ id: task.id })
}

export function cancelNotification(notification: NotificationInterface) {
  cancelNotifications([notification])
}

export function cancelNotifications(notifications: Array<NotificationInterface>) {
  if (process.env.MODE === 'capacitor') {
    Notifications.cancel({ notifications: notifications })
  } else {
    console.log("Progressive Web Apps don't support scheduled notifications. Sadge")
  }
}

export async function syncNotifications(store: any) {
  if (process.env.MODE === 'capacitor') {
    const previouslyScheduled = await Notifications.getPending()
    const currentlyScheduled = store.getters['tasks/tasksWithReminders'](store)
    const toBeCancelled = previouslyScheduled.notifications.filter(
      (notification: NotificationInterface) => {
        return !currentlyScheduled.some((task: Task) => {
          return notification.id === task.id
        })
      }
    ) // previouslyScheduled where not currentlyScheduled
    const toBeScheduled = currentlyScheduled.map((task: Task) => {
      return {
        id: task.id,
        title: task.title,
        schedule: { at: DateTime.fromISO(task.remind_me_at).toJSDate() },
        group: 'tasks'
      }
    })
    if (toBeCancelled.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      cancelNotifications(toBeCancelled)
    }
    if (toBeScheduled.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
//       console.debug(newChannel)
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
//     console.debug(newChannel)
//   }
// }
