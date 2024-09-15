import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { λ } from './types'
import { computed, DebuggerOptions } from 'vue'

export function timeThisAB<A, B>(func: λ<A, B>, name: string, ms = 500): λ<A, B> {
  return (x: A) => {
    const start = performance.now()
    const result = func(x)
    const duration = performance.now() - start
    if (duration > ms) console.warn(`${name} took ${Math.floor(duration)}ms; target is ${ms}ms`)
    return result
  }
}

export function timeThisABAsync<A, B>(
  func: λ<A, Promise<B>>,
  name: string,
  ms = 500
): λ<A, Promise<B>> {
  return async (x: A) => {
    const start = performance.now()
    const result = await func(x)
    const duration = performance.now() - start
    if (duration > ms) console.warn(`${name} took ${Math.floor(duration)}ms; target is ${ms}ms`)
    return result
  }
}

export function timeThisAABAsync<A, B, C>(
  func: (x: A, y: B) => Promise<C>,
  name: string,
  ms = 500
): (x: A, y: B) => Promise<C> {
  return async (x: A, y: B) => {
    const start = performance.now()
    const result = await func(x, y)
    const duration = performance.now() - start
    if (duration > ms) console.warn(`${name} took ${Math.floor(duration)}ms; target is ${ms}ms`)
    return result
  }
}

export function timeThisAAAsync<A, B>(
  func: (x: A, y: B) => Promise<void>,
  name: string,
  ms = 500
): (x: A, y: B) => Promise<void> {
  return async (x: A, y: B) => {
    const start = performance.now()
    await func(x, y)
    const duration = performance.now() - start
    if (duration > ms) console.warn(`${name} took ${Math.floor(duration)}ms; target is ${ms}ms`)
  }
}

export function timeThis(func: λ<void>, name: string, ms = 500) {
  return () => {
    const start = performance.now()
    func()
    const duration = performance.now() - start
    if (duration > ms) console.warn(`${name} took ${Math.floor(duration)}ms; target is ${ms}ms`)
  }
}

export function timeThisAsync(func: () => Promise<void>, name: string, ms = 500) {
  return async () => {
    const start = performance.now()
    await func()
    const duration = performance.now() - start
    if (duration > ms) console.warn(`${name} took ${Math.floor(duration)}ms; target is ${ms}ms`)
  }
}

export function timeThisB<B>(func: λ<void, B>, name: string, ms = 500) {
  return () => {
    const start = performance.now()
    const result = func()
    const duration = performance.now() - start
    if (duration > ms) console.warn(`${name} took ${Math.floor(duration)}ms; target is ${ms}ms`)
    return result
  }
}

/**
   * Pass in a function and this will return a modified function that can pause heavy computed properties.
   * @param func the function that needs to be run while main computed properties are paused.
   * @returns the function that includes necessary blocking logic
   */
export function blockingFunc<T>(func: (x: T) => Promise<unknown>): (x: T) => Promise<unknown> {
  return async (x: T) => {
    useLoadingStateStore().busy = true
    await func(x)
    useLoadingStateStore().busy = false
  }
}

// REVIEW: Why does this exist? Delete?
export function computedWithPrev<T>(func: λ<T, T>, options?: DebuggerOptions) {
  let previous: T
  return computed(() => {
    const result = func(previous)
    previous = result
    return result
  }, options)
}
