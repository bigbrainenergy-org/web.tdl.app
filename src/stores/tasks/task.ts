import { Model, useRepo } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Attr, BelongsTo, HasManyBy, Num } from 'pinia-orm/dist/decorators'
import { List } from '../lists/list'
import CustomRepo from '../generics/generic-repo'
import { SimpleTreeNode } from 'src/quasar-interfaces'
import { d3Node } from 'src/models/d3-interfaces'

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

  /// d3Node<Task>
  //  id: the task id
  //  obj: pass through the task object
  //  index: the 0-based node index for the chart
  //  x: the current x coordinate on the plane (origin is top left corner)
  //  y: the current y coordinate on the plane
  //  vx:
  //  vy:
  //  radius: calculated radius value of each node (to be drawn as a circle)
  //  color: if you want to color-code the nodes based on its properties.
  d3forceNode(index: number): d3Node<Task> {
    return {
      id: this.id ?? -1,
      obj: this,
      index: index, //node indices start at 0, sequential.
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: Math.max(this.hard_postreq_ids.length**2.3, 8),
      color: this.hard_prereq_ids.length === 0 ? 'red' : 'gray',
      repel: -500/this.hard_prereq_ids.length
    }
  }

  hashColor(): string {
    const exampleHash = (s: string) => {
      let hashification = 1337
      for(let i = 0; i < s.length; i++) {
        hashification = (hashification * 27) ^ s.charCodeAt(i)
      }
      return hashification >>> 0
    }
    const input: string = (this.id ?? '-1') + this.title
    const hash = exampleHash(input)
    const hexColor = '#' + (hash % 0xFFFFFF).toString(16).padStart(6, '0') + '66'
    return hexColor
  }

  hardPostreqTreeNodes(): SimpleTreeNode<Task>[] {
    const repo = useRepo(TaskRepo)
    return repo.where((x: Task) => this.hard_postreq_ids.includes(x.id ?? -1)).get().map((x) => x.treeNode())
  }

  static piniaOptions = {
    persist: true
  }
}

export class TaskRepo extends CustomRepo<CreateTaskOptions, UpdateTaskOptions, Task> {
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
