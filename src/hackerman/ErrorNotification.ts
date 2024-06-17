import { AxiosError } from 'axios'
import { Notify } from 'quasar'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'

export default function errorNotification(error: Error | AxiosError, fallbackMessage: string) {
  const errorMessage = `${fallbackMessage}: ${error.message}`

  Notify.create({
    color: 'negative',
    position: 'top',
    message: errorMessage,
    icon: 'report_problem',
    timeout: useLocalSettingsStore().notificationSpeed * 1500
  })

  return null
}
