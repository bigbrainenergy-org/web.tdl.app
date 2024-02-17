import { Model, useRepo } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Attr, BelongsTo, Bool, HasManyBy, HasOne, Num } from 'pinia-orm/dist/decorators'
import { List } from '../lists/list'
import GenericRepo from '../generics/generic-repo'
import ExpandedState from '../task-meta/expanded-state'
import { SimpleTreeNode } from 'src/quasar-interfaces'
import { d3Node } from 'src/models/d3-interfaces'
import { useLocalSettingsStore } from '../local-settings/local-setting'
import { useRawExpandedStateStore } from '../task-meta/raw-expanded-state-store'
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
  get hasIncompletePostreqs() {
    return this.hard_postreq_ids.length > 0 ? 
      this.grabPostreqs().some(x => !x.completed)
      : false
  }
  get hasPrereqs()  { return this.hard_prereq_ids.length  > 0 }
  get hasIncompletePrereqs() {
    return this.hard_prereq_ids.length > 0 ?
      this.grabPrereqs().some(x => !x.completed)
      : false
  }

  treeNode(reverse = false, hideCompleted = false, parentKey = ''): SimpleTreeNode<Task> {
    const node: any = {
      id: this.id,
      obj: this,
      label: this.title,
      key: this.id + '.' + parentKey
    }
    if(reverse && hideCompleted) {
      node.expandable = this.hasIncompletePrereqs
      node.lazy = this.hasIncompletePrereqs
      return node
    }
    if(reverse) {
      node.expandable = this.hasPrereqs,
      node.lazy = this.hasPrereqs
      return node
    }
    if(hideCompleted) {
      node.expandable = this.hasIncompletePostreqs,
      node.lazy = this.hasIncompletePostreqs
      return node
    }
    node.expandable = this.hasPostreqs
    node.lazy = this.hasPostreqs
    return node
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
      id: this.id,
      obj: this,
      index: index, //node indices start at 0, sequential.
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      radius: Math.min(useLocalSettingsStore().maxGraphNodeRadius, Math.max((useLocalSettingsStore().hideCompleted ? this.hard_postreqs.filter(x => !x.completed).length : this.hard_postreq_ids.length)**2.1, this.hard_prereqs.filter(x => !x.completed).length === 0 ? 16 : 8)),
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

  hasPostreq = (id: number) => this.hard_postreq_ids.includes(id)
  hasPrereq  = (id: number) => this.hard_prereq_ids.includes(id)

  grabPrereqs(incompleteOnly = false): Task[] {
    const repo = useRepo(TaskRepo)
    const pres = this.hard_prereqs ?? repo.where(x => x.hard_postreq_ids.includes(this.id)).get()
    console.debug({ incompleteOnly, pres_before_filtering: pres })
    return incompleteOnly ? pres.filter(x => !x.completed) : pres
  }

  grabPostreqs(incompleteOnly = false): Task[] {
    const repo = useRepo(TaskRepo)
    // if(typeof this.hard_postreqs === 'undefined') console.log('have to call repo to fetch postreqs')
    const posts = this.hard_postreqs ?? repo.where(x => x.hard_prereq_ids.includes(this.id)).get()
    return incompleteOnly ? posts.filter(x => !x.completed) : posts
  }

  hardPostreqTreeNodes(reverse = false, hideCompleted = false, parentKey = ''): SimpleTreeNode<Task>[] {
    return this.grabPostreqs(hideCompleted).map(x => x.treeNode(reverse, hideCompleted, parentKey))
  }

  hardPrereqTreeNodes(reverse = true, hideCompleted = false, parentKey = ''): SimpleTreeNode<Task>[] {
    return this.grabPrereqs(hideCompleted).map(x => x.treeNode(reverse, hideCompleted, parentKey))
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
    const options: UpdateTaskOptions = {
      id: task.id,
      payload: { task: Object.assign({}, task) }
    }
    options.payload.task.hard_prereq_ids!.splice(position, 1)
    await this.update(options).then(() => {
      const pre = Utils.hardCheck(this.find(id_of_prereq))
      Utils.arrayDelete(pre.hard_postreq_ids, task.id)
    })
    // TODO: remove post from prereq too.
  }

  /**
   * Remove a postrequisite from the specified task, and update the prerequisite ids of the old postrequisite.
   * @param task - the Task that is getting one fewer postrequisite
   * @param id_of_postreq - the id of the postrequisite to unlink
   */
  removePost = async (task: Task, id_of_postreq: number) => {
    const position = task.hard_postreq_ids.indexOf(id_of_postreq)
    if(position < 0) throw new Error('removePost: id provided was not found in postreqs list')
    const options: UpdateTaskOptions = {
      id: task.id,
      payload: { task: Object.assign({}, task) }
    }
    options.payload.task.hard_postreq_ids!.splice(position, 1)
    await this.update(options).then(() => {
      const post = Utils.hardCheck(this.find(id_of_postreq))
      Utils.arrayDelete(post.hard_prereq_ids, task.id)
    })
  }

  /**
   * Adds a prerequisite to the specified task, and updates the postrequisite ids list of the new prerequisite
   * @param task - The task that is getting a new prerequisite
   * @param id_of_prereq - The id of the prerequisite
   * @example
   * await useRepo(TaskRepo).addPre(task, pre.id)
   */
  addPre = async (task: Task, id_of_prereq: number) => {
    const pre = this.find(id_of_prereq)
    if(pre === null) throw new Error('prerequisite was not found in list')
    if(task.hard_prereq_ids.includes(id_of_prereq))
      throw new Error('addPre: id provided is already in prereqs list')
    const options: UpdateTaskOptions = {
      id: task.id,
      payload: { task: Object.assign({}, task) }
    }
    options.payload.task.hard_prereq_ids!.push(id_of_prereq)
    await this.update(options)
    const pre_options: UpdateTaskOptions = {
      id: pre.id,
      payload: { task: Object.assign({}, pre) }
    }
    pre_options.payload.task.hard_postreq_ids!.push(task.id)
    await this.update(pre_options)
  }

  /**
   * Adds a postrequisite to the specified task, and updates the prerequisite ids list of the new postrequisite
   * @param task - The task that is getting the new postrequisite
   * @param id_of_postreq - The id of the postrequisite
   * @example
   * await useRepo(TaskRepo).addPost(task, post.id)
   */
  addPost = async (task: Task, id_of_postreq: number) => {
    const post = this.find(id_of_postreq)
    if(post === null) throw new Error('postrequisite was not found in list')
    if(task.hard_prereq_ids.includes(id_of_postreq)) 
      throw new Error('addPost: id provided is already in postreqs list')
    const options: UpdateTaskOptions = {
      id: task.id,
      payload: { task: Object.assign({}, task) }
    }
    options.payload.task.hard_postreq_ids!.push(id_of_postreq)
    console.debug({ msg: 'pushing postreq to task.', payload: options.payload.task })
    await this.update(options)
    const post_options: UpdateTaskOptions = {
      id: post.id,
      payload: { task: Object.assign({}, post) }
    }
    post_options.payload.task.hard_prereq_ids!.push(task.id)
    console.debug({ msg: 'pushing prereq to new postreq of task', payload: post_options.payload.task })
    await this.update(post_options)
  }

  toggleCompleted = async (task: Task) => {
    const t = Object.assign({}, task)
    t.completed = !task.completed
    await this.update({ 
      id: task.id,
      payload: { task: t }
    })
  }

  deleteTask = async (task: Task) => {
    const currentTask = this.with('hard_prereqs').with('hard_postreqs').find(task.id)
    if(currentTask === null) throw new Error('task to delete was given but then it was not found in the list')
    const pres = currentTask.hard_prereqs
    const posts = currentTask.hard_postreqs
    console.debug({currentTask, pres, posts})
    for(let i = 0; i < pres.length; i++) {
      await this.removePost(pres[i], task.id).catch((x) => console.debug(x))
    }
    for(let i = 0; i < posts.length; i++) {
      await this.removePre(posts[i], task.id).catch((x) => console.debug(x))
    }
    useRawExpandedStateStore().forgetTask(task.id)
    return this.delete(task.id)
  }

  incompleteOnly = (): Task[] => this.withAll().get().filter(x => !x.completed)
  layerZero = (): Task[] => this.incompleteOnly().filter(x => x.hard_prereq_ids.length === 0 || !x.hard_prereqs.some(y => !y.completed))
}
