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
import { Queue } from 'src/utils/types'
import { timeThisB } from 'src/utils/performance-utils'
import { cachedTask, useAllTasksStore } from '../performance/all-tasks'
import { TaskCache } from '../performance/task-go-fast'

const createPayload = (task: Task): UpdateTaskOptions => {
  const payload = {
    task: {
      list_id: task.list_id,
      title: task.title,
      notes: task.notes,
      completed: task.completed,
      deadline_at: task.deadline_at,
      prioritize_at: task.prioritize_at,
      remind_me_at: task.remind_me_at,
      review_at: task.review_at,
      hard_prereq_ids: task.hard_prereq_ids,
      hard_postreq_ids: task.hard_postreq_ids,
      mental_energy_required: task.mental_energy_required,
      physical_energy_required: task.physical_energy_required
    }
  }
  return {
    id: task.id,
    payload
  }
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

interface RecursiveGetterOptions {
  /**
   * exclude completed tasks from the query
   */
  incompleteOnly: boolean
  /**
   * use only if allTasksStore has been regenerated
   */
  useStore: boolean
}

export class Task extends Model implements iRecord {
  static override entity = 'tasks'

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

  get hasPostreqs() {
    return this.hard_postreq_ids.length > 0
  }
  get hasIncompletePostreqs() {
    return this.hard_postreq_ids.length > 0 ? this.grabPostreqs().some((x) => !x.completed) : false
  }
  get hasPrereqs() {
    return this.hard_prereq_ids.length > 0
  }
  get hasIncompletePrereqs() {
    return this.hard_prereq_ids.length > 0 ? this.grabPrereqs(true).length > 0 : false
  }

  treeNode(reverse = false, hideCompleted = false, parentKey = ''): SimpleTreeNode<Task> {
    const node: any = {
      id: this.id,
      obj: this,
      label: this.title,
      key: this.id + '.' + parentKey
    }
    if (reverse && hideCompleted) {
      node.expandable = this.hasIncompletePrereqs
      node.lazy = this.hasIncompletePrereqs
      return node
    }
    if (reverse) {
      node.expandable = this.hasPrereqs
      node.lazy = this.hasPrereqs
      return node
    }
    if (hideCompleted) {
      node.expandable = this.hasIncompletePostreqs
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
      radius: Math.min(
        useLocalSettingsStore().maxGraphNodeRadius,
        Math.max(
          (useLocalSettingsStore().hideCompleted
            ? this.hard_postreqs.filter((x) => !x.completed).length
            : this.hard_postreq_ids.length) ** 2.1,
          this.hard_prereqs.filter((x) => !x.completed).length === 0 ? 16 : 8
        )
      ),
      color: this.completed
        ? '#003905'
        : this.hard_prereqs.filter((x) => !x.completed).length === 0
        ? 'red'
        : 'gray',
      repel: -1000 / this.hard_prereq_ids.length ** 2
    }
  }

  hashColor(): string {
    const exampleHash = (s: string) => {
      let hashification = 1337
      for (let i = 0; i < s.length; i++) {
        hashification = (hashification * 27) ^ s.charCodeAt(i)
      }
      return hashification >>> 0
    }
    const input: string = (this.id ?? '-1') + this.title
    const hash = exampleHash(input)
    const hexColor = '#' + (hash % 0xffffff).toString(16).padStart(6, '0') + '66'
    return hexColor
  }

  hasPostreq = (id: number) => this.hard_postreq_ids.includes(id)
  hasPrereq = (id: number) => this.hard_prereq_ids.includes(id)

  grabPrereqs(incompleteOnly = false): Task[] {
    const pres =
      useAllTasksStore().typed.get(this.id)?.hard_prereqs ??
      useRepo(TaskRepo)
        .where((x) => x.hard_postreq_ids.includes(this.id))
        .get()
    return incompleteOnly ? pres.filter((x) => !x.completed) : pres
  }

  grabPostreqs(incompleteOnly = false): Task[] {
    const posts =
      useAllTasksStore().typed.get(this.id)?.hard_postreqs ??
      useRepo(TaskRepo)
        .where((x) => x.hard_prereq_ids.includes(this.id))
        .get()
    return incompleteOnly ? posts.filter((x) => !x.completed) : posts
  }

  hardPostreqTreeNodes(
    reverse = false,
    hideCompleted = false,
    parentKey = ''
  ): SimpleTreeNode<Task>[] {
    return this.grabPostreqs(hideCompleted).map((x) =>
      x.treeNode(reverse, hideCompleted, parentKey)
    )
  }

  hardPrereqTreeNodes(
    reverse = true,
    hideCompleted = false,
    parentKey = ''
  ): SimpleTreeNode<Task>[] {
    return this.grabPrereqs(hideCompleted).map((x) => x.treeNode(reverse, hideCompleted, parentKey))
  }

  async toggleCompleted() {
    const repo = useRepo(TaskRepo)
    this.completed = !this.completed
    return repo
      .updateAndCache({
        id: this.id,
        payload: { task: { completed: this.completed } }
      })
      .then(TDLAPP.notifyUpdatedCompletionStatus, (error) => {
        throw error
      })
  }

  /***
   * terrible
   */
  async split(slices: number) {
    const repo = useRepo(TaskRepo)
    const title = (number: number) => `${this.title} (${number}/${slices})`
    if (slices <= 1) throw new Error(`Cannot slice a task into ${slices} piece(s).`)
    // copy the prereq and postreq id arrays
    const prereq_ids = Array.from(this.hard_prereq_ids)
    for (let i = 0; i < prereq_ids.length; i++) {
      repo.removePre(this, prereq_ids[i])
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
    for (let i = 0; i < slices - 1; i++) {
      newSlices.push(templateTaskSliceObj(i + 1))
    }
    for (let i = 0; i < newSlices.length; i++) {
      resultTasks.push(await repo.add(newSlices[i]))
    }
    for (let i = 0; i < prereq_ids.length; i++) {
      await repo.addPre(resultTasks[0], prereq_ids[i])
    }
    for (let i = 1; i < resultTasks.length; i++) {
      await repo.addPre(resultTasks[i], resultTasks[i - 1].id)
    }
    await repo.addPre(this, resultTasks[resultTasks.length - 1].id)
  }

  /**
   * @param {RecursiveGetterOptions} options - Options for the function
   * @returns a Set of all the task ids that must occur prior to this task
   */
  preIDsRecursive(options: RecursiveGetterOptions): Set<number> {
    const allTasks = useAllTasksStore().typed
    const allPres = new Set<number>()
    const queue = new Queue<number>()
    // todo - allTasks.get(this.id) is resulting in undefined after adding a postrequisite from the updatetaskdialog.
    if (typeof this.hard_prereqs === 'undefined') {
      useRepo(TaskRepo).with('hard_prereqs').load([this])
      allTasks.set(this.id, new cachedTask(this))
    }
    const preIDs = options.incompleteOnly
      ? (t: Task) => {
          let pres = t.hard_prereqs ?? allTasks.get(t.id)?.hard_prereqs
          if (typeof pres === 'undefined') {
            console.warn('manually loading task.')
            useRepo(TaskRepo).withAll().load([t])
            pres = t.hard_prereqs ?? []
            allTasks.set(t.id, new cachedTask(t))
          }
          return pres.filter((x) => !x.completed).map((x) => x.id)
        }
      : (t: Task) => {
          let pres = t.hard_prereqs ?? allTasks.get(t.id)?.hard_prereqs
          if (typeof pres === 'undefined') {
            console.warn('manually loading task.')
            useRepo(TaskRepo).withAll().load([t])
            pres = t.hard_prereqs ?? []
            allTasks.set(t.id, new cachedTask(t))
          }
          return pres.map((x) => x.id)
        }
    const preIDsCachedTask = options.incompleteOnly
      ? (t: cachedTask) => {
          const pres = t.hard_prereqs
          return pres.filter((x) => !x.completed).map((x) => x.id)
        }
      : (t: cachedTask) => {
          const pres = t.hard_prereqs
          return pres.map((x) => x.id)
        }
    const thisPres = preIDs(this)
    queue.enqueueAll(thisPres)
    while (queue.size > 0) {
      const tmpID = queue.dequeue()
      if (allPres.has(tmpID)) continue
      allPres.add(tmpID)
      let tmpTask = allTasks.get(tmpID)
      if (typeof tmpTask === 'undefined') {
        console.warn(`task ${tmpID} not found in cache. Manually loading task.`)
        const tmp = useRepo(TaskRepo).withAll().find(tmpID)
        if (tmp === null) throw new Error(`task ${tmpID} was not found anywhere!`)
        tmpTask = new cachedTask(tmp)
        allTasks.set(tmpID, tmpTask)
      }
      queue.enqueueAll(preIDsCachedTask(tmpTask))
    }
    return allPres
  }

  /**
   *
   * @param options
   * @returns
   */
  allPostIDsRecursive(options: RecursiveGetterOptions): Set<number> {
    const allTasks = useAllTasksStore().typed
    const allPosts = new Set<number>()
    const queue = new Queue<number>()
    const postIDs = options.incompleteOnly
      ? (t: Task) => {
          let posts = t.hard_postreqs ?? allTasks.get(t.id)?.hard_postreqs
          if (typeof posts === 'undefined') {
            console.warn('manually loading posts')
            useRepo(TaskRepo).withAll().load([t])
            posts = t.hard_postreqs ?? []
            allTasks.set(t.id, new cachedTask(t))
          }
          return posts.filter((x) => !x.completed).map((x) => x.id)
        }
      : (t: Task) => {
          let posts = t.hard_postreqs ?? allTasks.get(t.id)?.hard_postreqs
          if (typeof posts === 'undefined') {
            console.warn('manually loading posts')
            useRepo(TaskRepo).withAll().load([t])
            posts = t.hard_postreqs ?? []
            allTasks.set(t.id, new cachedTask(t))
          }
          return posts.map((x) => x.id)
        }
    const postIDsCachedTask = options.incompleteOnly
      ? (t: cachedTask) => {
          const posts = t.hard_postreqs
          return posts.filter((x) => !x.completed).map((x) => x.id)
        }
      : (t: cachedTask) => {
          const posts = t.hard_postreqs
          return posts.map((x) => x.id)
        }
    const thisPosts = postIDs(this)
    queue.enqueueAll(thisPosts)
    while (queue.size > 0) {
      const tmpID = queue.dequeue()
      if (allPosts.has(tmpID)) continue
      allPosts.add(tmpID)
      let tmpTask = allTasks.get(tmpID)
      if (typeof tmpTask === 'undefined') {
        console.warn(`task ${tmpID} not found in cache. Manually loading task.`)
        const tmp = useRepo(TaskRepo).withAll().find(tmpID)
        if (tmp === null) throw new Error(`task ${tmpID} was not found anywhere!`)
        tmpTask = new cachedTask(tmp)
        allTasks.set(tmpID, tmpTask)
      }
      queue.enqueueAll(postIDsCachedTask(tmpTask))
    }
    return allPosts
  }

  isIDAbove(id: number, options: { incompleteOnly: boolean; useStore: boolean }): boolean {
    const allPreIDs = this.preIDsRecursive(options)
    return allPreIDs.has(id)
  }

  isIDBelow(id: number, options: { incompleteOnly: boolean; useStore: boolean }): boolean {
    const allPostIDs = this.allPostIDsRecursive(options)
    return allPostIDs.has(id)
  }

  anyIDsAbove(
    ids: number[],
    options = { incompleteOnly: true, useStore: false }
  ): Map<number, boolean> {
    const allIDsAbove = this.preIDsRecursive(options)
    return new Map(ids.map((x) => [x, allIDsAbove.has(x)]))
  }

  anyIDsBelow(
    ids: number[],
    options = { incompleteOnly: true, useStore: false }
  ): Map<number, boolean> {
    const start = performance.now()
    const allIDsBelow = this.allPostIDsRecursive(options)
    const result = new Map(ids.map((x) => [x, allIDsBelow.has(x)]))
    const duration = Math.floor(performance.now() - start)
    const target = 90
    if (duration > target) console.warn(`anyIDsBelow took ${duration}ms - target is ${target}`)
    return result
  }

  hasRelationTo(id: number, options = { incompleteOnly: true, useStore: false }) {
    const opts = {
      incompleteOnly: options.incompleteOnly,
      useStore: options.useStore
    }
    return this.isIDAbove(id, opts) || this.isIDBelow(id, opts)
  }

  BulkHasRelationTo(ids: number[], options = { incompleteOnly: true, useStore: false }) {
    const opts = {
      incompleteOnly: options.incompleteOnly,
      useStore: options.useStore
    }
    const result = this.anyIDsAbove(ids, opts)
    this.anyIDsBelow(ids, opts).forEach((val, key) => {
      if (val) result.set(key, val)
    })
    return result
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
    if (taskWithKey.length === 0) console.warn('getTaskWithKey did not find any match')
    properties.forEach((p) => this.with(p).load(taskWithKey))
    return taskWithKey[0]
  }

  removePre = (task: Task, id_of_prereq: number) => {
    const position = task.hard_prereq_ids.indexOf(id_of_prereq)
    if (position < 0) throw new Error('removePre: id provided was not found in prereqs list')
    const options = createPayload(task)
    options.payload.task.hard_prereq_ids!.splice(position, 1)
    this.updateAndCache(options).then(() => {
      const pre: Task = Utils.hardCheck(this.find(id_of_prereq))
      Utils.arrayDelete(pre.hard_postreq_ids, task.id)
      this.where('id', pre.id).update({ hard_postreq_ids: pre.hard_postreq_ids })
      Utils.notifySuccess('Removed prerequisite')
    }, Utils.handleError('Error removing prerequisite'))
  }

  /**
   * Remove a postrequisite from the specified task, and update the prerequisite ids of the old postrequisite.
   * @param task - the Task that is getting one fewer postrequisite
   * @param id_of_postreq - the id of the postrequisite to unlink
   */
  removePost = (task: Task, id_of_postreq: number) => {
    const position = task.hard_postreq_ids.indexOf(id_of_postreq)
    if (position < 0) throw new Error('removePost: id provided was not found in postreqs list')
    const options = createPayload(task)
    options.payload.task.hard_postreq_ids!.splice(position, 1)
    this.updateAndCache(options).then(() => {
      const post: Task = Utils.hardCheck(this.find(id_of_postreq))
      // console.log(`before arrayDelete (pre ids): ${post.hard_prereq_ids}`)
      Utils.arrayDelete(post.hard_prereq_ids, task.id)
      console.log(`after arrayDelete (pre ids): ${post.hard_prereq_ids}`)
      this.where('id', post.id).update({ hard_prereq_ids: post.hard_prereq_ids })
      Utils.notifySuccess('Removed postrequisite')
    }, Utils.handleError('Error removing postrequisite'))
  }

  /**
   * Adds a prerequisite to the specified task, and updates the postrequisite ids list of the new prerequisite
   * @param task - The task that is getting a new prerequisite
   * @param id_of_prereq - The id of the prerequisite
   * @example
   * await useRepo(TaskRepo).addPre(task, pre.id)
   */
  addPre = async (task: Task, id_of_prereq: number) => {
    // notes 06/29/2024
    // 1. retrieve all records { pres_of_pre, pre, post, posts_of_post }
    // 2. validate new rule (recursion or redundancy, dupe, etc)

    try {
      TaskCache.checkAgainstKnownCompletedTasks(...task.grabPrereqs(true))
    } catch (error) {
      console.warn({ location: `pres of post: ${task.id} - ${task.title}`, error })
      throw error
    }
    const pre = useAllTasksStore().hardGet(id_of_prereq)
    const pres_of_pre = pre.t.grabPrereqs(true)
    try {
      TaskCache.checkAgainstKnownCompletedTasks(...pres_of_pre)
    } catch (error) {
      console.warn({ location: `pres of pre: ${task.id} - ${task.title}`, error })
      throw error
    }
    if (task.hard_prereq_ids.includes(id_of_prereq))
      throw new Error('addPre: id provided is already in prereqs list')

    const options = createPayload(task)

    if (typeof options.payload.task.hard_prereq_ids === 'undefined')
      options.payload.task.hard_prereq_ids = [id_of_prereq]
    else options.payload.task.hard_prereq_ids.push(id_of_prereq)
    try {
      // console.debug({ options })
      await this.updateAndCache(options) // we should only need one api call in order for the rails api to generate the hard_requisite record that joins two Tasks.
    } catch (error) {
      console.warn('error updating task to add a prerequisite.', error)
    }
    if (!pre.hard_postreq_ids.includes(task.id)) pre.hard_postreq_ids.push(task.id)
    this.where('id', pre.id).update({ hard_postreq_ids: pre.hard_postreq_ids })
  }

  /**
   * Adds a postrequisite to the specified task, and updates the prerequisite ids list of the new postrequisite
   * @param task - The task that is getting the new postrequisite
   * @param id_of_postreq - The id of the postrequisite
   * @example
   * await useRepo(TaskRepo).addPost(task, post.id)
   */
  addPost = async (task: Task, id_of_postreq: number) => {
    const post = Utils.hardCheck(
      this.withAll().find(id_of_postreq),
      'Postreq was not found in this list.'
    )
    // todo: write a real version of this function
    return await this.addPre(post, task.id)
  }

  deleteTask = async (task: Task) => {
    const currentTask = this.with('hard_prereqs').with('hard_postreqs').find(task.id)
    if (currentTask === null)
      throw new Error('task to delete was given but then it was not found in the list')
    const pres = currentTask.hard_prereqs
    const posts = currentTask.hard_postreqs
    console.debug({ currentTask, pres, posts })
    const debugError = (x: any) => console.debug(x)
    for (let i = 0; i < pres.length; i++) {
      this.removePost(pres[i], task.id)
    }
    for (let i = 0; i < posts.length; i++) {
      this.removePre(posts[i], task.id)
    }
    useRawExpandedStateStore().forgetTask(task.id)
    TaskCache.delete(task)
    return this.delete(task.id)
  }

  updateAndCache = async (options: UpdateTaskOptions): Promise<Task> => {
    const start = performance.now()
    // todo: when a task is marked complete which triggers quickSort dialog, the task stays visible on the page (agenda or Tasks)
    const ats = useAllTasksStore()
    const currentTask = ats.hardGet(options.id)
    const incompletePrereqIDs = (currentTask.hard_prereqs ?? [])
      .filter((x) => !x.completed)
      .map((x) => x.id)
    const anyPrereqsBelow = currentTask.t.anyIDsBelow(incompletePrereqIDs, {
      incompleteOnly: true,
      useStore: false
    })
    anyPrereqsBelow.forEach((val, key) => {
      if (val) {
        console.error(`This prereq is already a postreq: ${ats.hardGet(key).title}`)
        throw new Error('There is a prereq that is already supposed to be AFTER the current task')
      }
    })
    const incompletePostreqIDs =
      typeof currentTask.hard_postreqs === 'undefined'
        ? []
        : currentTask.hard_postreqs.filter((x) => !x.completed).map((x) => x.id)
    const anyPostreqsAbove = currentTask.t.anyIDsAbove(incompletePostreqIDs, {
      incompleteOnly: true,
      useStore: false
    })
    anyPostreqsAbove.forEach((val, key) => {
      if (val) {
        console.error(`this.postreq is already a prereq: ${ats.hardGet(key).title}`)
        throw new Error('There is a postreq that is already supposed to be BEFORE the current task')
      }
    })
    // console.debug({ options })
    return this.update(options).then(
      (data: null | Task) => {
        if (data !== null) {
          // console.debug({ 'setting cache': data })
          const duration = Math.floor(performance.now() - start)
          if (duration > 900)
            console.warn(`UpdateAndCache took longer than target of 900ms - it took ${duration}ms`)
          return TaskCache.update(data)
        } else {
          console.warn('update function returned void when Task is needed to continue processing.')
          throw new Error(
            'update function returned void when Task is needed to continue processing.'
          )
        }
      },
      (error) => {
        throw error
      }
    )
  }

  addAndCache = async (options: CreateTaskOptions) => {
    const data: Task = await this.add(options)
    return TaskCache.update(data)
  }

  incompleteOnly = (): Task[] =>
    this.withAll()
      .get()
      .filter((x) => !x.completed)

  layerZero = (): Task[] =>
    timeThisB(
      () => this.incompleteOnly().filter((x) => !x.hard_prereqs.some((y) => !y.completed)),
      'layerZeroRepoFunction',
      200
    )()
}
