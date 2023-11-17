import { Model, useRepo } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Attr, BelongsTo, HasOne, HasManyBy, Num } from 'pinia-orm/dist/decorators'
import { List } from '../lists/list'
import GenericRepo from '../generics/generic-repo'
import ExpandedState from '../expanded-state/expanded-state'
import { SimpleTreeNode } from 'src/quasar-interfaces'
import { X } from 'pinia-orm/dist/shared/pinia-orm.ed84a779'
import { Utils } from 'src/util'

export interface CreateTaskOptions {
  list_id?: number | null
  title: string
  notes?: string
  deadline_at?: string
  prioritize_at?: string
  remind_me_at?: string
  review_at?: string
  hard_prereq_ids?: number[]
  hard_postreq_ids?: number[]
  mental_energy_required?: number
  physical_energy_required?: number
}

export interface AllOptionalTaskProperties {
  list_id?: number | null
  title?: string
  notes?: string
  deadline_at?: string
  prioritize_at?: string
  remind_me_at?: string
  review_at?: string
  hard_prereq_ids?: number[]
  hard_postreq_ids?: number[]
  mental_energy_required?: number
  physical_energy_required?: number
}

export interface UpdateTaskOptions extends iOptions {
  id: number
  payload: {
    task: AllOptionalTaskProperties
  }
}

export class Task extends Model implements iRecord {
  static entity = 'tasks'

  // todo: switch to correct decorators
  @Attr(null) declare id: number | null
  @Attr(null) declare list_id: number | null
  @Attr('') declare title: string
  @Attr(0) declare order: number
  @Attr('') declare notes: string
  @Attr('') declare completed_at: string
  @Attr('') declare deadline_at: string
  @Attr('') declare prioritize_at: string
  @Attr('') declare remind_me_at: string
  @Attr('') declare review_at: string
  @Num(0) declare mental_energy_required: number
  @Num(0) declare physical_energy_required: number
  @Attr([]) declare hard_prereq_ids: number[]
  @Attr([]) declare hard_postreq_ids: number[]
  @Attr([]) declare tag_ids: number[]

  @BelongsTo(() => List, 'list_id') declare list: List | null
  @HasManyBy(() => Task, 'hard_prereq_ids') declare hard_prereqs: Task[]
  @HasManyBy(() => Task, 'hard_postreq_ids') declare hard_postreqs: Task[]

  get hasPostreqs() { return this.hard_postreq_ids.length > 0 }
  get hasPrereqs() { return this.hard_prereq_ids.length > 0 }

  treeNode(): SimpleTreeNode<Task> {
    return {
      id: this.id ?? -1,
      obj: this,
      label: this.title,
      expandable: this.hasPostreqs,
      lazy: this.hasPostreqs,
      key: this.id + '.' + Math.round(Math.random()*10000)
    }
  }

  hardPostreqTreeNodes(): SimpleTreeNode<Task>[] {
    const repo = useRepo(TaskRepo)
    return repo.where((x: Task) => this.hard_postreq_ids.includes(x.id ?? -1)).get().map((x) => x.treeNode())
  }

  static piniaOptions = {
    persist: true
  }
}

export class TaskRepo extends GenericRepo<CreateTaskOptions, UpdateTaskOptions, Task> {
  use = Task
  apidir = Task.entity

  getTaskWithKey = (key: string, ...properties: string[]) => {
    const id = parseInt(key.slice(0, key.indexOf('.')))
    const taskWithKey = this.where((x) => x.id === id).get()
    if(taskWithKey.length === 0) console.warn('getTaskWithKey did not find any match')
    properties.forEach((p) => this.with(p).load(taskWithKey))
    return taskWithKey[0]
  }
}
