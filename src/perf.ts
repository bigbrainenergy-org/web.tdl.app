import { λ } from './types'

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
