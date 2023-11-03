import { Model } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Attr } from 'pinia-orm/dist/decorators'
import CustomRepo from '../generics/generic-repo'

export interface CreateSubtaskOptions {
  task_id: number
  title: string
  order?: number
  completed?: boolean
}

export interface UpdateSubtaskOptions extends iOptions {
  id: number,
  payload: {
    subtask: {
      task_id?: number | null
      title?: string
      order?: number
      completed?: boolean
    }
  }
  
}

export class Subtask extends Model implements iRecord {
  static entity = 'subtasks'

  // todo: don't just use attr
  @Attr(null) declare id: number | null
  @Attr(null) declare task_id: number | null
  @Attr('') declare title: string
  @Attr(0) declare order: number
  @Attr(false) declare completed: boolean
}

export class SubtaskRepo extends CustomRepo<CreateSubtaskOptions, UpdateSubtaskOptions, Subtask> {
  use = Subtask
  apidir = Subtask.entity
}
