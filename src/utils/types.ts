import { AxiosError } from 'axios'
import { Model, PrimaryKey } from 'pinia-orm'

// hahaha.... started as a joke but I kindof like it.
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
}

export interface TaskGetterOptions {
  incompleteOnly: boolean | undefined
  useStore: boolean | undefined
}

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
