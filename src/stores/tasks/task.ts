import { Model, useRepo } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Attr, BelongsTo, Bool, HasManyBy, HasOne, Num } from 'pinia-orm/dist/decorators'
import { List } from '../lists/list'
import GenericRepo from '../generics/generic-repo'
import ExpandedState from '../task-meta/expanded-state'
import { SimpleTreeNode } from 'src/quasar-interfaces'
import { d3Node } from 'src/models/d3-interfaces'
import { Utils } from 'src/util'
import Priority from '../task-meta/priority'
import { useLocalSettingsStore } from '../local-settings/local-setting'

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
  @Num(-1) declare id: number
  @Attr(null) declare list_id: number | null
  @Attr('') declare title: string
  @Attr(0) declare order: number
  @Attr('') declare notes: string
  @Bool(false) declare completed: boolean
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
  @HasOne(() => ExpandedState, 'id') declare expanded_state: ExpandedState

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
  d3forceNode(index: number, width = 0, height = 0): d3Node<Task> {
    return {
      id: this.id ?? -1,
      obj: this,
      index: index, //node indices start at 0, sequential.
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      radius: Math.min(450, Math.max((useLocalSettingsStore().hideCompleted ? this.hard_postreqs.filter(x => !x.completed).length : this.hard_postreq_ids.length)**2.1, this.hard_prereqs.filter(x => !x.completed).length === 0 ? 16 : 8)),
      color: this.completed ? '#003905' : (this.hard_prereqs.filter(x => !x.completed).length === 0 ? 'red' : 'gray'),
      repel: -1000/(this.hard_prereq_ids.length**2)
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

  removePre = async (task: Task, id_of_prereq: number) => {
    const position = task.hard_prereq_ids.indexOf(id_of_prereq)
    if(position < 0) throw new Error('removePre: id provided was not found in prereqs list')
    const taskID = Utils.hardCheck(task.id, "removePre: task's id was null or undefined")
    const options: UpdateTaskOptions = {
      id: taskID,
      payload: { task }
    }
    task.hard_prereq_ids.splice(position, 1)
    await this.update(options)
  }

  removePost = async (task: Task, id_of_postreq: number) => {
    const position = task.hard_postreq_ids.indexOf(id_of_postreq)
    if(position < 0) throw new Error('removePost: id provided was not found in postreqs list')
    const taskID = Utils.hardCheck(task.id, "removePost: task's id was null or undefined")
    const options: UpdateTaskOptions = {
      id: taskID,
      payload: { task }
    }
    task.hard_postreq_ids.splice(position, 1)
    await this.update(options)
  }

  addPre = async (task: Task, id_of_prereq: number) => {
    const position = task.hard_prereq_ids.indexOf(id_of_prereq)
    if(position >= 0) throw new Error('addPre: id provided is already in prereqs list')
    const taskID = Utils.hardCheck(task.id, "addPre: task's id was null or undefined")
    const pre = this.find(id_of_prereq)
    if(pre === null) throw new Error('prerequisite was not found in list')
    const options: UpdateTaskOptions = {
      id: taskID,
      payload: { task }
    }
    task.hard_prereq_ids.push(id_of_prereq)
    await this.update(options)
    const pre_options: UpdateTaskOptions = {
      id: Utils.hardCheck(pre.id, 'task id was null or undefined'),
      payload: { task: pre }
    }
    pre.hard_postreq_ids.push(taskID)
    await this.update(pre_options)
  }

  addPost = async (task: Task, id_of_postreq: number) => {
    const position = task.hard_prereq_ids.indexOf(id_of_postreq)
    if(position >= 0) throw new Error('addPost: id provided is already in postreqs list')
    const taskID = Utils.hardCheck(task.id, "addPost: task's id was null or undefined")
    const post = this.find(id_of_postreq)
    if(post === null) throw new Error('postrequisite was not found in list')
    const options: UpdateTaskOptions = {
      id: taskID,
      payload: { task }
    }
    task.hard_postreq_ids.push(id_of_postreq)
    await this.update(options)
    const post_options: UpdateTaskOptions = {
      id: Utils.hardCheck(post.id, 'task id was null or undefined'),
      payload: { task: post }
    }
    post.hard_prereq_ids.push(taskID)
    await this.update(post_options)
  }

  toggleCompleted = async (task: Task) => {
    task.completed = !task.completed
    await this.update({ 
      id: Utils.hardCheck(task.id, 'task id was null or undefined'),
      payload: { task }
    })
  }

  deleteTask = async (task: Task) => {
    const task_id = Utils.hardCheck(task.id, 'task id was null or undefined')
    const currentTask = this.with('hard_prereqs').with('hard_postreqs').find(task_id)
    if(currentTask === null) throw new Error('task to delete was given but then it was not found in the list')
    const pres = currentTask.hard_prereqs
    const posts = currentTask.hard_postreqs
    console.debug({currentTask, pres, posts})
    for(let i = 0; i < pres.length; i++) {
      await this.removePost(pres[i], task_id).catch((x) => console.debug(x))
    }
    for(let i = 0; i < posts.length; i++) {
      await this.removePre(posts[i], task_id).catch((x) => console.debug(x))
    }
    return this.delete(task_id)
  }

  incompleteOnly = (): Task[] => this.withAll().get().filter(x => !x.completed)
  layerZero = (): Task[] => this.incompleteOnly().filter(x => x.hard_prereq_ids.length === 0 || !x.hard_prereqs.some(y => !y.completed))
}
