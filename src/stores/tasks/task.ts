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
import { Utils, exists } from 'src/util'
import { TDLAPP } from 'src/TDLAPP'
import { Queue } from 'src/types'
import { useAllTasksStore } from '../performance/all-tasks'
import { timeThisABAsync, timeThisB } from 'src/perf'
import { useLayerZeroStore } from '../performance/layer-zero'

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
      ;(node.expandable = this.hasPrereqs), (node.lazy = this.hasPrereqs)
      return node
    }
    if (hideCompleted) {
      ;(node.expandable = this.hasIncompletePostreqs), (node.lazy = this.hasIncompletePostreqs)
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
    const repo = useRepo(TaskRepo)
    const pres = this.hard_prereqs ?? repo.where((x) => x.hard_postreq_ids.includes(this.id)).get()
    // console.debug({ incompleteOnly, pres_before_filtering: pres })
    return incompleteOnly ? pres.filter((x) => !x.completed) : pres
  }

  grabPostreqs(incompleteOnly = false): Task[] {
    const repo = useRepo(TaskRepo)
    // if(typeof this.hard_postreqs === 'undefined') console.log('have to call repo to fetch postreqs')
    const posts = this.hard_postreqs ?? repo.where((x) => x.hard_prereq_ids.includes(this.id)).get()
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
    console.debug(this.completed + ' prev completed status')
    this.completed = !this.completed
    console.debug(this.completed + ' new completed status')
    await repo
      .updateAndCache({
        id: this.id,
        payload: { task: { completed: this.completed } }
      })
      .then(
        TDLAPP.notifyUpdatedCompletionStatus(this),
        Utils.handleError('Error updating status of task.')
      )
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
    const allTasks = options.useStore
      ? useAllTasksStore().allTasks
      : new Map(
          useRepo(TaskRepo)
            .with('hard_prereqs')
            .get()
            .map((x) => [x.id, x])
        )
    const allPres = new Set<number>()
    const queue = new Queue<number>()
    // todo - allTasks.get(this.id) is resulting in undefined after adding a postrequisite from the updatetaskdialog.
    if (typeof this.hard_prereqs === 'undefined') {
      useRepo(TaskRepo).with('hard_prereqs').load([this])
      allTasks.set(this.id, this)
    }
    const preIDs = (t: Task) =>
      (options.incompleteOnly ? t.hard_prereqs.filter((x) => !x.completed) : t.hard_prereqs).map(
        (x) => x.id
      )
    const thisPres = preIDs(this)
    queue.enqueueAll(thisPres)
    while (queue.size > 0) {
      const tmpID = queue.dequeue()
      if (allPres.has(tmpID)) continue
      allPres.add(tmpID)
      let tmpTask = allTasks.get(tmpID) as Task | undefined
      if (typeof tmpTask === 'undefined')
        tmpTask = useRepo(TaskRepo).withAll().find(tmpID) ?? undefined
      if (typeof tmpTask === 'undefined')
        throw new Error(`Task ID ${tmpID} cannot be found in the Task Repository.`)
      else allTasks.set(tmpID, tmpTask)
      queue.enqueueAll(preIDs(tmpTask))
    }
    return allPres
  }

  /**
   *
   * @param options
   * @returns
   */
  allPostIDsRecursive(options: RecursiveGetterOptions): Set<number> {
    const allTasks = options.useStore
      ? useAllTasksStore().allTasks
      : new Map(
          useRepo(TaskRepo)
            .with('hard_postreqs')
            .get()
            .map((x) => [x.id, x])
        )
    const allPosts = new Set<number>()
    const queue = new Queue<number>()
    const postIDs = (t: Task) => {
      if (typeof t.hard_postreqs === 'undefined') {
        useRepo(TaskRepo).with('hard_postreqs').load([t])
        allTasks.set(t.id, t)
      }
      return (
        options.incompleteOnly ? t.hard_postreqs.filter((x) => !x.completed) : t.hard_postreqs
      ).map((x) => x.id)
    }
    const thisPosts = postIDs(this)
    queue.enqueueAll(thisPosts)
    while (queue.size > 0) {
      const tmpID = queue.dequeue()
      if (allPosts.has(tmpID)) continue
      allPosts.add(tmpID)
      let tmpTask = allTasks.get(tmpID) as Task | undefined
      if (typeof tmpTask === 'undefined')
        tmpTask = useRepo(TaskRepo).withAll().find(tmpID) ?? undefined
      if (typeof tmpTask === 'undefined')
        throw new Error(`Task ID ${tmpID} cannot be found in the Task Repository`)
      else allTasks.set(tmpID, tmpTask)
      queue.enqueueAll(postIDs(tmpTask))
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
    const allIDsBelow = this.allPostIDsRecursive(options)
    return new Map(ids.map((x) => [x, allIDsBelow.has(x)]))
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

  removePre = async (task: Task, id_of_prereq: number) => {
    const position = task.hard_prereq_ids.indexOf(id_of_prereq)
    if (position < 0) throw new Error('removePre: id provided was not found in prereqs list')
    const options: UpdateTaskOptions = {
      id: task.id,
      payload: { task: Object.assign({}, task) }
    }
    options.payload.task.hard_prereq_ids!.splice(position, 1)
    await this.updateAndCache(options).then(() => {
      const pre: Task = Utils.hardCheck(this.find(id_of_prereq))
      Utils.arrayDelete(pre.hard_postreq_ids, task.id)
      this.save(pre)
      this.setCache(pre)
    })
  }

  /**
   * Remove a postrequisite from the specified task, and update the prerequisite ids of the old postrequisite.
   * @param task - the Task that is getting one fewer postrequisite
   * @param id_of_postreq - the id of the postrequisite to unlink
   */
  removePost = async (task: Task, id_of_postreq: number) => {
    const position = task.hard_postreq_ids.indexOf(id_of_postreq)
    if (position < 0) throw new Error('removePost: id provided was not found in postreqs list')
    const options: UpdateTaskOptions = {
      id: task.id,
      payload: { task: Object.assign({}, task) }
    }
    options.payload.task.hard_postreq_ids!.splice(position, 1)
    await this.updateAndCache(options).then(() => {
      const post = Utils.hardCheck(this.withAll().find(id_of_postreq))
      console.log(`before arrayDelete (pre ids): ${post.hard_prereq_ids}`)
      Utils.arrayDelete(post.hard_prereq_ids, task.id)
      console.log(`after arrayDelete (pre ids): ${post.hard_prereq_ids}`)
      this.save(post)
      this.setCache(post)
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
    const pre = Utils.hardCheck(
      useAllTasksStore().allTasks.get(id_of_prereq),
      'Prerequisite was not found in this list.'
    ) as Task
    if (task.hard_prereq_ids.includes(id_of_prereq))
      throw new Error('addPre: id provided is already in prereqs list')
    const options: UpdateTaskOptions = {
      id: task.id,
      payload: { task: Object.assign({}, task) }
    }
    if (typeof options.payload.task.hard_prereq_ids === 'undefined')
      options.payload.task.hard_prereq_ids = [id_of_prereq]
    else options.payload.task.hard_prereq_ids.push(id_of_prereq)
    await this.updateAndCache(options) // we should only need one api call in order for the rails api to generate the hard_requisite record that joins two Tasks.
    if (!pre.hard_postreq_ids.includes(task.id)) pre.hard_postreq_ids.push(task.id)
    this.save(pre)
    this.setCache(pre, true)
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
    if (task.hard_postreq_ids.includes(id_of_postreq))
      throw new Error('addPost: id provided is already in postreqs list')
    const options: UpdateTaskOptions = {
      id: task.id,
      payload: { task: Object.assign({}, task) }
    }
    options.payload.task.hard_postreq_ids!.push(id_of_postreq)
    await this.updateAndCache(options)
    if (!post.hard_prereq_ids.includes(task.id)) post.hard_prereq_ids.push(task.id)
    this.save(post)
    this.setCache(post, true)
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
      await this.removePost(pres[i], task.id).catch(debugError)
    }
    for (let i = 0; i < posts.length; i++) {
      await this.removePre(posts[i], task.id).catch(debugError)
    }
    useRawExpandedStateStore().forgetTask(task.id)
    useAllTasksStore().allTasks.delete(task.id)
    return this.delete(task.id)
  }

  updateAndCache = async (options: UpdateTaskOptions) => {
    // check if any hard prereq ids are in the recursive postreqs
    // check if any hard postreq ids are in the recursive prereqs
    const currentTask = useAllTasksStore().allTasks.get(options.id)
    if (!exists(currentTask))
      throw new Error('Task sent for updating was not found on the local repository')
    const incompletePrereqIDs = exists(currentTask.hard_prereqs)
      ? currentTask.hard_prereqs.filter((x) => !x.completed).map((x) => x.id)
      : []
    const anyPrereqsBelow = currentTask.anyIDsBelow(incompletePrereqIDs, {
      incompleteOnly: true,
      useStore: false
    })
    const anyPrereqsBelowResult: Task[] = []
    anyPrereqsBelow.forEach((val, key) => {
      if (val) anyPrereqsBelowResult.push(Utils.hardCheck(this.find(key)) as Task)
    })
    if (anyPrereqsBelowResult.length > 0) {
      anyPrereqsBelowResult.forEach((x) =>
        console.error(`This prereq is already a postreq: ${x.title}`)
      )
      throw new Error('There is a prereq that is already supposed to be AFTER the current task')
    }
    const incompletePostreqIDs =
      typeof currentTask.hard_postreqs === 'undefined'
        ? []
        : currentTask.hard_postreqs.filter((x) => !x.completed).map((x) => x.id)
    const anyPostreqsAbove = currentTask.anyIDsAbove(incompletePostreqIDs, {
      incompleteOnly: true,
      useStore: false
    })
    const anyPostreqsAboveResult: Task[] = []
    anyPostreqsAbove.forEach((val, key) => {
      if (val) anyPostreqsAboveResult.push(Utils.hardCheck(this.find(key)) as Task)
    })
    if (anyPostreqsAboveResult.length > 0) {
      anyPostreqsAboveResult.forEach((x) =>
        console.error(`This postreq is already a prereq: ${x.title}`)
      )
      throw new Error('There is a postreq that is already supposed to be BEFORE the current task')
    }
    await this.update(options).then((data: void | Task) => {
      if (data instanceof Task) {
        console.log('setting cache.')
        this.setCache(data, true)
      }
    })
  }

  addAndCache = async (options: CreateTaskOptions) => {
    return await timeThisABAsync(
      this.add,
      'this.add',
      500
    )(options).then((data: Task) => this.setCache(data))
  }

  setCache = (task: Task, getAll = false) => {
    const t = getAll ? this.withAll().find(task.id) : task
    console.log({ method: 'setCache', t })
    if (t === null) throw new Error('Task not found in the repository, so it cannot be cached.')
    useAllTasksStore().allTasks.set(t.id, t)
    useLayerZeroStore().checkAndSet(t)
    return t
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
