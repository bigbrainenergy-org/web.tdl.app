import { boot } from 'quasar/wrappers';
import { errorNotification } from '../hackerman/ErrorNotification'
import { syncWithBackend } from '../hackerman/sync'
import { Settings } from 'luxon'

export default boot(({ store }) => {
  const savedZone = store.getters['users/timeZone']
  if (savedZone) {
    Settings.defaultZone = savedZone
  }
  if (store.getters['authentication/loggedIn'] === true) {
    syncWithBackend(store)
  } else {
    // console.log('not logged in')
  }
});
