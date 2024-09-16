import { useRepo } from 'pinia-orm'
import { SimpleTreeNode } from 'src/quasar-interfaces'
import { TDLAPP } from 'src/TDLAPP'
import { ListRepo } from '../lists/list'
import { ProcedureRepo } from '../procedures/procedure'
import { ExpandedStateRepo } from '../task-meta/expanded-state'
import { TaskLike, CreateTaskOptions } from './task-interfaces-types'
import { useTaskStore } from './task-store'
import { d3Node } from 'src/models/d3-interfaces'
import { useLocalSettingsStore } from '../local-settings/local-setting'

export class Task implements TaskLike {
  hard_prereq_ids: number[]
  hard_postreq_ids: number[]
  _hard_prereq_ids: number[]
  _hard_postreq_ids: number[]
  hard_prereqs: Task[]
  hard_postreqs: Task[]
  incomplete_prereqs: Task[]
  incomplete_postreqs: Task[]
  completed: boolean
  id: number
  title: string
  notes?: string
  list_id?: number
  deadline_at?: string
  prioritize_at?: string
  remind_me_at?: string
  review_at?: string
  procedure_ids?: number[]
  mental_energy_required: number
  physical_energy_required: number
  constructor(data: TaskLike) {
    this._hard_prereq_ids = []
    this._hard_postreq_ids = []
    this.hard_prereqs = [] // this._hard_prereq_ids.map(retrieve)
    this.hard_postreqs = [] // this._hard_postreq_ids.map(retrieve)
    this.incomplete_prereqs = []
    this.incomplete_postreqs = []
    this.hard_prereq_ids = new Proxy(this._hard_prereq_ids, {
      set: (target, property, value: number) => {
        target[property as any] = value
        if (typeof property === 'symbol') {
          console.debug({ 'symbol access of hard_prereq_ids': property })
          return true
        }
        if (property === null || property === '') {
          console.debug({ 'null or empty property name access of hard_prereq_ids': property })
          return true
        }
        if (property === 'length') return true
        if (isNaN(Number(property))) {
          console.debug({
            'catch-all for hard_prereq_ids access that does not fit a mould': property
          })
          return true
        }
        const obj = useTaskStore().mapp.get(value)
        if (typeof obj !== 'undefined') {
          this.hard_prereqs[property as any] = obj as Task
          if (!obj.completed) this.incomplete_prereqs.push(obj as Task)
        }
        return true
      },
      get: (target, prop) => {
        // TODO: this is pretty weaksauce
        if (typeof prop === 'symbol') return target[prop as any]
        if (prop === null || prop === '') return target
        if (isNaN(Number(prop))) return target[prop as any]
        const val = target[prop as any]
        if (this.hard_prereqs[prop as any] === null) {
          const obj = useTaskStore().hardGet(val)
          this.hard_prereqs[prop as any] = obj
          if (!obj.completed) {
            if (this.incomplete_prereqs.findIndex((x) => x.id === obj.id) < 0) {
              this.incomplete_prereqs.push(obj)
            }
          }
        }
        return val
      },
      apply: (target, thisArg, argumentsList) => {
        const result = (target as any).apply(thisArg, argumentsList)
        this.fullSyncPres()
        return result
      }
    })
    this.hard_prereq_ids.push(...data.hard_prereq_ids)
    this.hard_postreq_ids = new Proxy(this._hard_postreq_ids, {
      set: (target, property, value: number) => {
        target[property as any] = value
        if (typeof property === 'symbol') {
          console.debug({ 'symbol access of hard_postreq_ids': property })
          return true
        }
        if (property === null || property === '') {
          console.debug({ 'null or empty property name access of hard_postreq_ids': property })
          return true
        }
        if (property === 'length') return true
        if (isNaN(Number(property))) {
          console.debug({
            'catch-all for hard_postreq_ids access that does not fit a mould': property
          })
          return true
        }
        const obj = useTaskStore().mapp.get(value) // FIXME: this used to be hardGet but it runs into issues when adding tasks one by one to an empty store.
        if (typeof obj !== 'undefined') {
          this.hard_postreqs[property as any] = obj as Task
          if (!obj.completed) this.incomplete_postreqs.push(obj as Task)
        }
        return true
      },
      get: (target, prop) => {
        // TODO: this is pretty weaksauce
        if (typeof prop === 'symbol') return target[prop as any]
        if (prop === null || prop === '') return target
        if (isNaN(Number(prop))) return target[prop as any]
        const val = target[prop as any]
        if (this.hard_postreqs[prop as any] === null) {
          const obj = useTaskStore().hardGet(val)
          this.hard_postreqs[prop as any] = obj
          if (!obj.completed) {
            if (this.incomplete_postreqs.findIndex((x) => x.id === obj.id) < 0) {
              this.incomplete_postreqs.push(obj)
            }
          }
        }
        return val
      },
      apply: (target, thisArg, argumentsList) => {
        const result = (target as any).apply(thisArg, argumentsList)
        this.fullSyncPosts()
        return result
      }
    })
    this.hard_postreq_ids.push(...data.hard_postreq_ids)
    this.completed = data.completed
    this.id = data.id
    this.title = data.title
    this.notes = data.notes
    this.list_id = data.list_id
    this.deadline_at = data.deadline_at
    this.prioritize_at = data.prioritize_at
    this.remind_me_at = data.remind_me_at
    this.review_at = data.review_at
    this.procedure_ids = data.procedure_ids
    this.mental_energy_required = data.mental_energy_required
    this.physical_energy_required = data.physical_energy_required
  }
  fullSyncPres() {
    // TODO: make private if possible
    const hp = []
    for (let i = 0; i < this._hard_prereq_ids.length; i++) {
      try {
        const pre = useTaskStore().hardGet(this._hard_prereq_ids[i])
        hp.push(pre)
      } catch (e) {
        console.warn(`tried to get pres for ${this.title} but encountered an error.`)
        continue
      }
    }
    this.hard_prereqs = hp
    this.incomplete_prereqs = this.hard_prereqs.filter((x) => !x.completed)
  }
  fullSyncPosts() {
    const hp = []
    for (let i = 0; i < this._hard_postreq_ids.length; i++) {
      try {
        const post = useTaskStore().hardGet(this._hard_postreq_ids[i])
        hp.push(post)
      } catch (e) {
        console.warn(`tried to get posts for ${this.title} but encountered an error.`)
        continue
      }
    }
    this.hard_postreqs = hp
    this.incomplete_postreqs = this.hard_postreqs.filter((x) => !x.completed)
  }
  get list() {
    const id = this.list_id
    if (typeof id === 'undefined') return undefined
    return useRepo(ListRepo).find(id) ?? undefined
  }
  get procedures() {
    const ids = this.procedure_ids
    if (typeof ids === 'undefined') return []
    return useRepo(ProcedureRepo)
      .where((x) => ids.includes(x.id))
      .get()
  }
  toggleCompleted() {
    this.completed = !this.completed
    return this.updateTaskCompletionStatus()
  }
  /**
   * A similar function but just sets up the api update to only have a payload containing the new completed status; does not actively switch the completed status
   */
  updateTaskCompletionStatus() {
    return useTaskStore()
      .apiUpdate(this.id, { completed: this.completed })
      .then(() => {
        TDLAPP.considerOpeningQuickSort('mark task complete')
      })
  }
  grabPrereqs(incompleteOnly: boolean) {
    return incompleteOnly ? this.incomplete_prereqs : this.hard_prereqs
  }
  grabPostreqs(incompleteOnly: boolean) {
    return incompleteOnly ? this.incomplete_postreqs : this.hard_postreqs
  }
  anyIDsAbove(ids: number[]): Map<number, boolean> {
    const ts = useTaskStore()
    const allIDsAbove = ts.idsBefore(this.id)
    return new Map(ids.map((x) => [x, allIDsAbove.has(x)]))
  }
  anyIDsBelow(ids: number[]): Map<number, boolean> {
    const ts = useTaskStore()
    const allIDsBelow = ts.idsAfter(this.id)
    return new Map(ids.map((x) => [x, allIDsBelow.has(x)]))
  }
  hasRelationTo(id: number) {
    const ts = useTaskStore()
    const idsAfter = ts.idsAfter(this.id)
    const idsBefore = ts.idsBefore(this.id)
    return idsAfter.has(id) || idsBefore.has(id)
  }
  hasRelationToAny(ids: number[]) {
    const result = this.anyIDsAbove(ids)
    this.anyIDsBelow(ids).forEach((val, key) => {
      if (val) result.set(key, val)
    })
    return result
  }
  get rawData(): Pick<Task, keyof TaskLike> {
    return {
      id: this.id,
      hard_prereq_ids: this.hard_prereq_ids,
      hard_postreq_ids: this.hard_postreq_ids,
      completed: this.completed,
      title: this.title,
      mental_energy_required: this.mental_energy_required,
      physical_energy_required: this.physical_energy_required,
      procedure_ids: this.procedure_ids,
      remind_me_at: this.remind_me_at,
      review_at: this.review_at,
      notes: this.notes,
      list_id: this.list_id,
      deadline_at: this.deadline_at,
      prioritize_at: this.prioritize_at
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
  get hasPrereqs() {
    return this.hard_prereq_ids.length > 0
  }
  get hasPostreqs() {
    return this.hard_postreq_ids.length > 0
  }
  get expanded_state() {
    return useRepo(ExpandedStateRepo).getByTaskID(this.id)
  }
  treeNode(reverse = false, hideCompleted = false, parentKey = ''): SimpleTreeNode<Task> {
    const node: any = {
      id: this.id,
      obj: this,
      label: this.title,
      key: this.id + '.' + parentKey
    }
    if (reverse && hideCompleted) {
      node.expandable = this.incomplete_prereqs.length > 0
      node.lazy = this.incomplete_prereqs.length > 0
      return node
    }
    if (reverse) {
      node.expandable = this.hasPrereqs
      node.lazy = this.hasPrereqs
      return node
    }
    if (hideCompleted) {
      node.expandable = this.incomplete_postreqs.length > 0
      node.lazy = this.incomplete_postreqs.length > 0
      return node
    }
    node.expandable = this.hasPostreqs
    node.lazy = this.hasPostreqs
    return node
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

  hardPrereqTreeNodes(reverse = true, hideCompleted = false, parentKey = ''): SimpleTreeNode<Task>[] {
    return this.grabPrereqs(hideCompleted).map((x) => x.treeNode(reverse, hideCompleted, parentKey))
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
  async split(slices: number) {
    // const repo = useRepo(TaskRepo)
    const title = (number: number) => `${this.title} (${number}/${slices})`
    if (slices <= 1) throw new Error(`Cannot slice a task into ${slices} piece(s).`)
    // copy the prereq and postreq id arrays
    const prereq_ids = Array.from(this.hard_prereq_ids)
    for (let i = 0; i < prereq_ids.length; i++) {
      useTaskStore().removeRule(prereq_ids[i], this.id)
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
    const ts = useTaskStore()
    // the last slice is the original task record
    for (let i = 0; i < slices - 1; i++) {
      newSlices.push(templateTaskSliceObj(i + 1))
    }
    for (let i = 0; i < newSlices.length; i++) {
      const tmp = await ts.apiCreate(newSlices[i])
      if (tmp !== null) resultTasks.push(tmp)
    }
    for (let i = 0; i < prereq_ids.length; i++) {
      await ts.addRule(prereq_ids[i], resultTasks[0].id)
    }
    for (let i = 1; i < resultTasks.length; i++) {
      await ts.addRule(resultTasks[i - 1].id, resultTasks[i].id)
      // await ts.addPre(resultTasks[i], resultTasks[i - 1].id)
    }
    await ts.addRule(resultTasks[resultTasks.length - 1].id, this.id)
  }
}
