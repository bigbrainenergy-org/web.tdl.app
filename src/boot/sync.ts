import { boot } from 'quasar/wrappers';
import { errorNotification } from '../hackerman/ErrorNotification'
import { syncWithBackend } from '../hackerman/sync'
import { Settings } from 'luxon'

export default boot(({ store }) => {
  const savedZone = store.getters['settings/timeZone']
  if (savedZone) {
    Settings.defaultZone = savedZone
  }
  if (store.getters['authentication/loggedIn'] == true) {
    syncWithBackend(store)
  }
});
