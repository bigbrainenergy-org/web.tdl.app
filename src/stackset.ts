class StackSet<T> {
  private set: Set<T>
  private traversed: Set<T>
  constructor() {
    this.set = new Set<T>()
    this.traversed = new Set<T>()
  }
  push = (element: T): void => {
    if (!this.traversed.has(element)) this.set.add(element)
  }
  pushAll = (elements: T[]): void => {
    elements.forEach(this.push)
  }
  pop = (): T | undefined => {
    if (this.set.size === 0) {
      return undefined
    }
    const lastElement: T | undefined = this.set.values().next().value
    if (typeof lastElement === 'undefined') return undefined
    this.set.delete(lastElement)
    this.traversed.add(lastElement)
    return lastElement
  }
  size() {
    return this.set.size
  }
}
