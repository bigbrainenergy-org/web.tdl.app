import {
  Notification as NotificationInterface,
  NextAction as NextActionInterface
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

export function scheduleNextActionNotification(nextAction: NextActionInterface) {
  if (nextAction.remind_me_at) {
    scheduleNotification({
      id: nextAction.id,
      title: nextAction.title,
      schedule: { at: DateTime.fromISO(nextAction.remind_me_at).toJSDate() },
      group: 'nextActions'
    })
  }
}

export function cancelNextActionNotification(nextAction: NextActionInterface) {
  cancelNotification({ id: nextAction.id })
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
    const currentlyScheduled = store.getters['nextActions/nextActionsWithReminders'](store)
    const toBeCancelled = previouslyScheduled.notifications.filter(
      (notification: NotificationInterface) => {
        return !(
          currentlyScheduled.some(
            (nextAction: NextActionInterface) => {
              return notification.id === nextAction.id
            }
          )
        )
      }
    ) // previouslyScheduled where not currentlyScheduled
    const toBeScheduled = currentlyScheduled.map(
      (nextAction: NextActionInterface) => {
        return {
          id: nextAction.id,
          title: nextAction.title,
          // @ts-ignore
          schedule: { at: DateTime.fromISO(nextAction.remind_me_at).toJSDate() },
          group: 'nextActions'
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

// const createNextActionsChannel = (
//  () => {
//   let executed = false
//   return () => {
//     if (!executed) {
//       executed = true
//       const newChannel = LocalNotifications.createChannel({
//         id: 'tdl-app-nextActions',
//         name: 'TDL App NextActions',
//         description: 'NextActions from TDL App',
//         sound: null,
//         vibration: false
//       })
//       console.log(newChannel)
//     }
//   }
//  }
// )()

// export function createNextActionsChannel() {
//   if (process.env.MODE === 'capacitor') {
//     const newChannel = Notifications.createChannel({
//       id: 'tdl-app-nextActions',
//       name: 'TDL App NextActions',
//       description: 'NextActions from TDL App',
//       sound: 'tuturu.wav',
//       importance: 3,
//       vibration: false
//     })
//     console.log(newChannel)
//   }
// }
