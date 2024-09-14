import { AxiosError } from 'axios'
import errorNotification from './hackerman/ErrorNotification'
import { Notify } from 'quasar'
import { NodeKey, λ } from './types'
import { Settings } from 'luxon'
import { DebuggerOptions, computed } from 'vue'
import { useLocalSettingsStore } from './stores/local-settings/local-setting'

export class Utils {
  static gracefulError = (error: Error | AxiosError, memo = 'Error') =>
    errorNotification(error, memo)

  static handleError(memo: string): λ<Error | AxiosError, null> {
    return (error: Error | AxiosError) => {
      console.warn(error)
      errorNotification(error, memo)
      return null
    }
  }
  static notifySuccess(memo?: string, icon?: string) {
    Notify.create({
      color: 'positive',
      position: 'top',
      message: memo ?? 'I am so happy',
      icon: icon ?? 'fa-solid fa-link',
      timeout: useLocalSettingsStore().notificationSpeed * 1500
    })
  }
  static handleSuccess(memo?: string, icon?: string): λ {
    return () => this.notifySuccess(memo, icon)
  }
  static todo(s?: string) {
    throw new Error(s ?? 'needs refactor')
  }
  static hardCheck<T>(t: T | undefined | null, memo = 'ERROR'): T {
    if (!exists(t)) {
      const e = new Error(`variable was undefined: ${memo}`)
      errorNotification(e, memo)
      throw e
    }
    return t
  }
  static arrayDelete<T>(arr: Array<T>, element: T, key?: keyof T) {
    if (arr.length === 0) {
      console.trace('arrayDelete: array is empty')
      throw new Error('arrayDelete: array is empty')
    }
    if (typeof element === 'object' && typeof key === 'undefined') {
      console.trace('arrayUpdate: key is required for object arrays.')
    }
    const i =
      typeof key === 'undefined'
        ? arr.indexOf(element)
        : arr.findIndex((x) => x[key] === element[key])
    if (i >= 0) arr.splice(i, 1)
    else {
      console.trace('arrayDelete will not delete any elements because they were not found.')
    }
    return arr
  }
  /**
   *
   * @param arr the array to do the update
   * @param element element of the array
   * @param key object key to compare
   * Will add the element instead if the element is not found.
   */
  static arrayUpdate<T>(arr: Array<T>, element: T, key: keyof T) {
    // TODO: this function doesn't work lol.
    if (arr.length === 0) {
      console.trace('arrayUpdate: array is empty')
      throw new Error('arrayUpdate: array is empty')
    }
    const i = arr.findIndex((x) => x[key] === element[key])
    // console.debug({ method: 'arrayUpdate', arr, element, key })
    if (i < 0) {
      console.debug({
        method: 'arrayUpdate',
        msg: 'element not found in array. pushing instead.',
        arr,
        element,
        key
      })
      arr.push(element)
    } else arr[i] = element
  }
  static onlyInLeftArray<T>(A: T[], B: T[], key: keyof T) {
    return A.filter((x) => !B.some((y) => y[key] === x[key]))
  }

  /**
   * @param a an array
   * @param b an array of the same type
   * @returns array of elements shared by both arrays, i.e. inner join.
   */
  static innerJoin<T>(a: T[], b: T[]) {
    const setB = new Set(b)
    return a.filter((x) => setB.has(x))
  }
  static combineArrays(a: NodeKey[], b: NodeKey[]) {
    return [...a, ...this.onlyInLeftArray(b, a, 'key')]
  }
  static venn<T extends { id: number }>(a: T[], b: T[]) {
    const setB = new Set<number>(b.map((x) => x.id))
    const left = a.filter((x) => !setB.has(x.id))
    const center = a.filter((x) => setB.has(x.id))
    const setCenter = new Set<number>(center.map((x) => x.id))
    const right = b.filter((x) => !setCenter.has(x.id))
    // todo: optimize
    return { left, center, right }
  }

  static filterMap<K, V>(map: Map<K, V>, predicate: (key: K, value: V) => boolean) {
    const result = new Map()
    // eslint-disable-next-line prefer-const
    for (let [key, value] of map) {
      if (predicate(key, value)) {
        result.set(key, value)
      }
    }
    return result
  }

  static getRandomInt(max: number) {
    return Math.floor(Math.random() * max)
  }

  static updateLuxonTimeZone(newTimeZone: string) {
    Settings.defaultZone = newTimeZone
  }

  static debugComputed(
    options: { debug: boolean; verbose: boolean } = {
      debug: false,
      verbose: false
    }
  ) {
    return {
      // if verbose is enabled, this might log hundreds of thousands of things to console.
      onTrack: options.verbose
        ? (event: unknown) => {
            console.debug('Tracked:', event)
            if (options.debug) debugger // This will pause execution in the debugger
            console.trace('onTrack')
          }
        : undefined,
      onTrigger(event: unknown) {
        console.debug('Triggered:', event)
        if (options.debug) debugger // This will pause execution in the debugger
        console.trace('onTrigger')
      }
    }
  }
}

export function computedWithPrev<T>(func: λ<T, T>, options?: DebuggerOptions) {
  let previous: T
  return computed(() => {
    const result = func(previous)
    previous = result
    return result
  }, options)
}

export function exists<T>(t: T | undefined | null): t is T {
  if (typeof t === 'undefined' || t === null) return false
  return true
}
