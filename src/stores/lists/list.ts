import { Model } from 'pinia-orm'
import type { iOptions } from '../generics/i-record'
import type iRecord from '../generics/i-record'
import { Attr, Num, Str } from 'pinia-orm/dist/decorators'
import GenericRepo from '../generics/generic-repo'
import { useTaskStore } from 'src/stores/tasks/task-store'
import type { Task } from 'src/stores/tasks/task-model'

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
      schedule_id?: number | null
    }
  }
}

export class List extends Model implements iRecord {
  static override entity = 'lists'

  @Num(-1) declare id: number
  @Str('') declare title: string
  @Str('') declare color: string
  @Num(0) declare order: number
  @Str('') declare notes: string
  @Attr(undefined) declare schedule_id: number | undefined

  // @HasMany(() => Task, 'list_id') declare tasks: Task[]
  get tasks(): Task[] {
    return useTaskStore().array.filter((x) => x.list_id === this.id)
  }

  get incompleteTaskCount() {
    return this.tasks.filter((task) => !task.completed && task.grabPrereqs(true).length === 0).length
  }

  static override piniaOptions = {
    persist: true
  }
}

export class ListRepo extends GenericRepo<CreateListOptions, UpdateListOptions, List> {
  override use = List
  override apidir = List.entity
}
