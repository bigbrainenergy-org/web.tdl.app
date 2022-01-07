import { errorNotification } from './ErrorNotification'
import { syncNotifications } from './ScheduledNotifications'

export function syncWithBackend(store: any) {
  store.dispatch('users/fetchUser').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch user metadata')
    }
  )
  store.dispatch('inboxItems/fetchInboxItems').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch inbox items')
    }
  )
  store.dispatch('nextActions/fetchNextActions').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch next actions')
    }
  )
  store.dispatch('waitingFors/fetchWaitingFors').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch waiting fors')
    }
  )
  store.dispatch('projects/fetchProjects').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch projects')
    }
  )
  store.dispatch('timeZones/fetchTimeZones').
  catch(
    (error: any) => {
      errorNotification(error, 'Failed to fetch time zones')
    }
  )
}
