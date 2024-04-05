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
import { TDLAPP } from 'src/TDLAPP'
import { ID, Queue, λ } from 'src/types'
import { useAllTasksStore } from '../performance/all-tasks'

interface TaskLike {
  completed: boolean
}

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
  completed?: boolean
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

interface TraversalOptions {
  /**
   * Set to true if you wish to filter out all completed tasks and their connections to other tasks.
   * If there are tasks A --> B --> C and B is complete, with incompleteOnly == true, A would not relate to C
   */
  incompleteOnly: boolean
  /**
   * Set to true if you have populated allTasksStore and intend to use it for performance reasons.
   */
  useStore: boolean
}

const allWithPres = (): Map<ID, Task> => new Map(useRepo(TaskRepo).with('hard_prereqs').get().map(x => [x.id, x]))
const allWithPosts = (): Map<ID, Task> => new Map(useRepo(TaskRepo).with('hard_postreqs').get().map(x => [x.id, x]))
const allFromStore = (): Map<ID, Task> => useAllTasksStore().allTasks as Map<ID, Task>

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
    // console.debug({ incompleteOnly, pres_before_filtering: pres })
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

  async toggleCompleted() {
    const repo = useRepo(TaskRepo)
    this.completed = !this.completed
    await repo.update({ id: this.id, payload: { task: { completed: this.completed } } } )
      .then(
        TDLAPP.notifyUpdatedCompletionStatus(this), 
        Utils.handleError('Error updating status of task.'))
  }

  /***
   * terrible
   */
  async split(slices: number) {
    const repo = useRepo(TaskRepo)
    const title = (number: number) => `${this.title} (${number}/${slices})`
    if(slices <= 1) throw new Error(`Cannot slice a task into ${slices} piece(s).`)
    // copy the prereq and postreq id arrays
    const prereq_ids = Array.from(this.hard_prereq_ids)
    for(let i = 0; i < prereq_ids.length; i++) {
      await repo.removePre(this, prereq_ids[i])
    }
    // make a template object (strip away title, prereqs, and postreqs)
    const templateTaskSliceObj = (number: number): CreateTaskOptions => ({
      list_id: this.list_id,
      title: title(number),
      notes: this.notes,
      deadline_at: this.deadline_at,
      prioritize_at: this.prioritize_at,
      remind_me_at: this.remind_me_at,
      review_at: this.review_at,
      hard_prereq_ids: prereq_ids,
      hard_postreq_ids: [],
      mental_energy_required: this.mental_energy_required,
      physical_energy_required: this.physical_energy_required
    })
    // collect the generated slices
    const newSlices: Array<CreateTaskOptions> = []
    const resultTasks: Array<Task> = []
    // the last slice is the original task record
    for(let i = 0; i < slices - 1; i++) {
      newSlices.push(templateTaskSliceObj(i+1))
    }
    for(let i = 0; i < newSlices.length; i++) {
      resultTasks.push(await repo.add(newSlices[i]))
    }
    for(let i = 0; i < prereq_ids.length; i++) {
      await repo.addPre(resultTasks[0], prereq_ids[i])
    }
    for(let i = 1; i < resultTasks.length; i++) {
      await repo.addPre(resultTasks[i], resultTasks[i-1].id)
    }
    await repo.addPre(this, resultTasks[resultTasks.length-1].id)
  }

  isIDAbove(id: ID, options: TraversalOptions): boolean {
    const allTasks = options.useStore ? allFromStore() : allWithPres()
    const alreadyScanned = new Set<ID>()
    const queue = new Queue<ID>()
    let toQueue = allTasks.get(this.id)!.hard_prereqs
    if(options.incompleteOnly) toQueue = toQueue.filter(x => !x.completed)
    queue.enqueueAll(toQueue.map(x => x.id))
    while(queue.size > 0) {
      const currentID = queue.dequeue()
      alreadyScanned.add(currentID)
      let prereqs = allTasks.get(currentID)?.hard_prereqs.filter(x => !queue.has(x.id) && !alreadyScanned.has(x.id)) ?? []
      if(options.incompleteOnly) prereqs = prereqs.filter(x => !x.completed)
      if(prereqs.length === 0) continue
      const prereq_ids = prereqs.map(x => x.id)
      if(prereq_ids.includes(id)) return true
      queue.enqueueAll(prereq_ids)
    }
    return false
  }

  isIDBelow(id: ID, options: TraversalOptions): boolean {
    const allTasks = options.useStore ? allFromStore() : allWithPosts()
    const alreadyScanned = new Set<ID>()
    const queue = new Queue<ID>()
    let toQueue = allTasks.get(this.id)!.hard_postreqs
    if(options.incompleteOnly) toQueue = toQueue.filter(x => !x.completed)
    queue.enqueueAll(toQueue.map(x => x.id))
    while(queue.size > 0) {
      const currentID = queue.dequeue()
      alreadyScanned.add(currentID)
      let postreqs = allTasks.get(currentID)?.hard_postreqs.filter(x => !queue.has(x.id) && !alreadyScanned.has(x.id)) ?? []
      if(options.incompleteOnly) postreqs = postreqs.filter(x => !x.completed)
      if(postreqs.length === 0) continue
      const postreq_ids = postreqs.map(x => x.id)
      if(postreq_ids.includes(id)) return true
      queue.enqueueAll(postreq_ids)
    }
    return false
  }

  anyIDsBelow(ids: ID[], options: TraversalOptions): Map<ID, boolean> {
    const allTasks = options.useStore ? allFromStore() : new Map<ID, Task>(useRepo(TaskRepo).withAll().get().map(x => [x.id, x]))
    const alreadyScanned = new Map<ID, boolean>()
    const initialIDs = new Set<ID>(ids)
    const queue = new Queue<ID>()
    const results = new Map<ID, boolean>()
    queue.enqueueAll(ids)
    while(queue.size > 0) {
      const currentID = queue.dequeue()
      const precheck = alreadyScanned.get(currentID)
      if(typeof precheck !== 'undefined') {
        if(initialIDs.has(currentID)) {
          results.set(currentID, precheck)
        }
        continue
      }
      const currentTask = allTasks.get(currentID)
      if(typeof currentTask === 'undefined') continue

    }
    return results
  }

  hasRelationTo(id: number, options: TraversalOptions) {
    return this.isIDAbove(id, options) || this.isIDBelow(id, options)
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
