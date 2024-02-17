import { AxiosError } from 'axios'

// hahaha.... started as a joke but I kindof like it.
export type λ<inputType = void | unknown, returnType = void> = (inputArgument: inputType) => returnType

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
    return keys.map(x => this.fromKey(x))
  }
}

export type SimpleMenuItem<T> = {
  label: string
  icon: string
  action: λ<T, Promise<T | void> | void>
}

export type ApiError = Error | AxiosError<unknown, any>