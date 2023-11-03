import { AxiosError } from 'axios'
import { Notify } from 'quasar'

export default function errorNotification(error: Error | AxiosError, fallbackMessage: string) {
  const errorMessage = `${fallbackMessage}: ${error.message}`

  Notify.create({
    color: 'negative',
    position: 'top',
    message: errorMessage,
    icon: 'report_problem'
  })
}