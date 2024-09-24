import { AxiosError } from 'axios'
import { RouteTo } from 'src/router/routes'

// hahaha.... started as a joke but I kindof like it.
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type λ<inputType = void | unknown, returnType = void> = (
  inputArgument: inputType
) => returnType

export class NodeKey {
  id: number
  key: string
  constructor(id: number, key: string) {
    this.id = id
    this.key = key
  }
  static idFromKey(key: string) {
    return parseInt(key.slice(0, key.indexOf('.')))
  }
  static fromKey(key: string): NodeKey {
    return new NodeKey(this.idFromKey(key), key)
  }
  static fromKeys(keys: string[]): NodeKey[] {
    return keys.map((x) => this.fromKey(x))
  }
}

export type SimpleMenuItem<T> = {
  label: string
  icon: string
  action: λ<T, Promise<T | void> | void>
}

export type ApiError = Error | AxiosError<unknown, any>

export class Queue<T> {
  private set: Set<T>
  constructor() {
    this.set = new Set()
  }
  enqueue(value: T): void {
    this.set.add(value)
  }
  enqueueAll(values: T[]): void {
    values.forEach((x) => this.enqueue(x))
  }
  dequeue(): T {
    const values = this.set.values()
    const value = values.next().value as T
    this.set.delete(value)
    return value
  }
  get size(): number {
    return this.set.size
  }
  has(value: T): boolean {
    return this.set.has(value)
  }
  filterDequeue(predicate: (t: T) => boolean): T[] {
    const result = Array.from(this.set.values()).filter(predicate)
    result.forEach((x) => this.set.delete(x))
    return result
  }
}

export interface TaskGetterOptions {
  incompleteOnly: boolean | undefined
  useStore: boolean | undefined
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type unknownishλ<T> = λ<T, unknown | Promise<unknown>>

export type Button<T> = {
  color: string
  label: string
  dataCy: string
  action: unknownishλ<T>
}

export type ripped<T> = T extends readonly (infer U)[]
  ? U
  : T extends (infer U)[]
    ? U
    : T extends (...args: any[]) => infer U
      ? U
      : T extends Promise<infer U>
        ? U
        : T

export type NumericKeysObject<T> = { [key: number]: T }

const icons = [
  'fa-solid fa-circle-dot',
  'fa-solid fa-inbox',
  'fa-solid fa-project-diagram',
  'fa-solid fa-star',
  'fa-solid fa-list-check',
  'fa-solid fa-calendar-day',
  'hub',
  'self_improvement'
] as const

export type Icon = (typeof icons)[number]

export type RouteTab = {
  icon: Icon
  to: RouteTo
  label: string
  enabled: boolean
  default: boolean
}

export type HasID = { id: number }
