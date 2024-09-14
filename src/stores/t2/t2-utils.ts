import { TaskLike } from './t2-interfaces-types'
import { T2 } from './t2-model'
import { useT2Store } from './t2-store'

export const retrieve = (id: number): T2 => useT2Store().hardGet(id)
export const incompleteOnly = (t: TaskLike) => !t.completed
