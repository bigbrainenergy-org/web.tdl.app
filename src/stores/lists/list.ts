import { Model } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Attr, HasMany, Num, Str } from 'pinia-orm/dist/decorators'
import GenericRepo from '../generics/generic-repo'
import { Task } from '../tasks/task'

export interface CreateListOptions {
  title: string
  order?: number
}

export interface UpdateListOptions extends iOptions {
  id: number
  payload: {
    list: {
      title?: string
      order?: number
    }
  }
}

export class List extends Model implements iRecord {
  static entity = 'lists'

  @Num(-1) declare id: number
  @Str('') declare title: string
  @Str('') declare color: string
  @Num(0) declare order: number
  @Str('') declare notes: string

  @HasMany(() => Task, 'list_id') declare tasks: Task[]

  get incompleteTaskCount() {
    return this.tasks.filter((task) => !task.completed).length
  }

  static piniaOptions = {
    persist: true
  }
}

export class ListRepo extends GenericRepo<CreateListOptions, UpdateListOptions, List> {
  use = List
  apidir = List.entity
}
