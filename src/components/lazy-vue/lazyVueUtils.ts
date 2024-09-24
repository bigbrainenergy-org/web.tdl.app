export interface PropStructure {
  name: string
  edit: boolean
  config?: string
}
export interface GenericPropStructure {
  name: string
  showEdit?: boolean
}

export type SingularPrimitive = number | boolean | string | undefined | null

export type Obj =
  | object
  | {
      [key: string]: SingularPrimitive | Obj | SingularPrimitive[] | Obj[]
    }

export type Singular = Obj | SingularPrimitive

export type WTF = SingularPrimitive | SingularPrimitive[] | Obj | Obj[]

export function isArray(value: any): value is WTF[] {
  return Array.isArray(value)
}

export function isNotArray(value: Singular | Singular[]): value is Singular {
  return !Array.isArray(value)
}

export function isSingularObject(x: unknown): x is object {
  return typeof x === 'object' && isNotArray(x)
}

export function isNotObject(
  x: object | unknown[] | SingularPrimitive
): x is unknown[] | SingularPrimitive {
  return typeof x !== 'object' || isArray(x)
}

export function isSingularPrimitive(x: unknown): x is SingularPrimitive {
  return (
    typeof x === 'boolean' ||
    typeof x === 'number' ||
    typeof x === 'string' ||
    typeof x === 'undefined'
  )
}
