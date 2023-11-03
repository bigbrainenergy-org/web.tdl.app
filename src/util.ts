import { AxiosError } from 'axios';
import errorNotification from './hackerman/ErrorNotification'
import { useQuasar } from 'quasar'

export class Utils {
  static gracefulError = (error: Error | AxiosError, memo = 'Error') => errorNotification(error, memo)

  static handleError(memo: string) {
    return (error: Error | AxiosError) => errorNotification(error, memo)
  }
  static notifySuccess(memo?: string, icon?: string) {
    const $q = useQuasar()
    $q.notify({
      color: 'positive',
      position: 'top',
      message: memo ?? 'I am so happy',
      icon: icon ?? 'fa-solid fa-link'
    })
  }
  static handleSuccess(memo?: string, icon?: string) {
    return () => this.notifySuccess(memo, icon)
  }
  static todo(s?: string) {
    throw new Error(s ?? 'needs refactor')
  }
  static hardCheck<T>(t: T | undefined | null, memo = 'ERROR'): T {
    if (typeof t === 'undefined' || t === null) {
      const e = new Error('variable was undefined.')
      errorNotification(e, memo)
      throw e
    }
    return t
  }
}
