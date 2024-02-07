import { AxiosError } from 'axios';
import errorNotification from './hackerman/ErrorNotification'
import { Notify } from 'quasar'
import { NodeKey, λ } from './types'

export class Utils {
  static gracefulError = (error: Error | AxiosError, memo = 'Error') => errorNotification(error, memo)

  static handleError(memo: string): λ<Error | AxiosError, void> {
    return (error: Error | AxiosError) => errorNotification(error, memo)
  }
  static notifySuccess(memo?: string, icon?: string) {
    Notify.create({
      color: 'positive',
      position: 'top',
      message: memo ?? 'I am so happy',
      icon: icon ?? 'fa-solid fa-link'
    })
  }
  static handleSuccess(memo?: string, icon?: string): λ {
    return () => this.notifySuccess(memo, icon)
  }
  static todo(s?: string) {
    throw new Error(s ?? 'needs refactor')
  }
  static hardCheck<T>(t: T | undefined | null, memo = 'ERROR'): T {
    if (typeof t === 'undefined' || t === null) {
      const e = new Error(`variable was undefined: ${memo}`)
      errorNotification(e, memo)
      throw e
    }
    return t
  }
  static arrayDelete<T>(arr: Array<T>, element: T) {
    const i = arr.indexOf(element)
    if(i >= 0) arr.splice(i, 1)
    return arr
  }
  static onlyInLeftArray(leftArr: NodeKey[], rightArr: NodeKey[]) {
    return leftArr.filter(x => !rightArr.some(y => y.key === x.key))
  }
  static innerJoin<T>(a: T[], b: T[]) {
    const setB = new Set(b)
    return a.filter(x => setB.has(x))
  }
  static combineArrays(a: NodeKey[], b: NodeKey[]) {
    return [...a, ...this.onlyInLeftArray(b, a)]
  }
}
