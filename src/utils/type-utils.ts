import { errorNotification } from './notification-utils'

export function hardCheck<T>(t: T | undefined | null, memo = 'ERROR'): T {
  if (!exists(t)) {
    const e = new Error(`variable was undefined: ${memo}`)
    errorNotification(e, memo)
    throw e
  }
  return t
}

export function exists<T>(t: T | undefined | null): t is T {
  if (typeof t === 'undefined' || t === null) return false
  return true
}

export type Override<T, U> = Omit<T, keyof U> & U
