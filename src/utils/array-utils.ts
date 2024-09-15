export function arrayDelete<T>(arr: Array<T>, element: T, key?: keyof T) {
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
export function arrayUpdate<T>(arr: Array<T>, element: T, key: keyof T) {
  if (arr.length === 0) {
    console.trace('arrayUpdate: array is empty')
    throw new Error('arrayUpdate: array is empty')
  }
  const i = arr.findIndex((x) => x[key] === element[key])
  // console.debug({ method: 'arrayUpdate', arr, element, key })
  if (i < 0) {
    console.trace('arrayUpdate will not update any element because it was not found')
    throw new Error('arrayUpdate will not update any element because it was not found')
  } else arr[i] = element
}
export function onlyInLeftArray<T>(A: T[], B: T[], key: keyof T) {
  return A.filter((x) => !B.some((y) => y[key] === x[key]))
}

/**
 * @param a an array
 * @param b an array of the same type
 * @returns array of elements shared by both arrays, i.e. inner join.
 */
export function innerJoin<T>(a: T[], b: T[]) {
  const setB = new Set(b)
  return a.filter((x) => setB.has(x))
}
export function combineArrays(a: NodeKey[], b: NodeKey[]) {
  return [...a, ...this.onlyInLeftArray(b, a, 'key')]
}
export function venn<T extends { id: number }>(a: T[], b: T[]) {
  const setB = new Set<number>(b.map((x) => x.id))
  const left = a.filter((x) => !setB.has(x.id))
  const center = a.filter((x) => setB.has(x.id))
  const setCenter = new Set<number>(center.map((x) => x.id))
  const right = b.filter((x) => !setCenter.has(x.id))
  // todo: optimize
  return { left, center, right }
}

export function filterMap<K, V>(map: Map<K, V>, predicate: (key: K, value: V) => boolean) {
  const result = new Map()
  // eslint-disable-next-line prefer-const
  for (let [key, value] of map) {
    if (predicate(key, value)) {
      result.set(key, value)
    }
  }
  return result
}
