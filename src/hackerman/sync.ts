import { errorNotification } from './ErrorNotification'
import { syncNotifications } from './ScheduledNotifications'

export function syncWithBackend(store: any) {
  store.dispatch('settings/fetchUsername').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch username')
    }
  )
  store.dispatch('settings/fetchTimeZone').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch time zone')
    }
  )
  store.dispatch('settings/fetchTimeZones').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch time zones')
    }
  )
  store.dispatch('lists/fetchLists').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch lists')
    }
  )
  store.dispatch('tags/fetchTags').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch tags')
    }
  )
  store.dispatch('tasks/fetchTasks').
  then(
    () => {
      // @ts-ignore
      syncNotifications(store).
      catch(
        (error: any) => {
          errorNotification(error, 'Failed to sync notifications')
        }
      )
    },
    (error: any) => {
      errorNotification(error, 'Failed to fetch tasks')
    }
  )
}
