import { useRepo } from 'pinia-orm'
import { ListRepo } from '../lists/list'
import { ProcedureRepo } from '../procedures/procedure'
import { ExpandedStateRepo } from '../task-meta/expanded-state'
import type { TaskLike, CreateTaskOptions } from './task-interfaces-types'
import { useTaskStore } from './task-store'
import type { d3Node } from 'src/models/d3-interfaces'
import { useLocalSettingsStore } from '../local-settings/local-setting'
import { considerOpeningQuickSortDialog } from 'src/utils/dialog-utils'
import type { SimpleTreeNode } from 'src/utils/quasar-interfaces'
import { taskLike } from './task-utils'
import { useTaskStarredStore } from './task-starred'
import { useDependencyStore } from '../dependencies/dependency-store'
export interface TaskDepRef {
  task: Task
  degree: 1 | 2 | 3 | null
}

export class Task implements TaskLike {
  completed: boolean
  id: number
  title: string
  notes?: string
  list_id?: number
  schedule_id?: number | null
  deadline_at?: string
  prioritize_at?: string
  remind_me_at?: string
  review_at?: string
  procedure_ids?: number[]
  mental_energy_required: number
  physical_energy_required: number
  task_duration_in_minutes?: number
  declare pres: TaskDepRef[]
  declare posts: TaskDepRef[]
  declare _refsBuilt: boolean
  constructor(data: TaskLike | CreateTaskOptions) {
    this.completed = taskLike(data, 'completed') ? data.completed : false
    this.id = taskLike(data, 'id') ? data.id : -1
    this.title = data.title
    this.notes = data.notes
    this.list_id = data.list_id ?? undefined
    this.schedule_id = data.schedule_id
    this.deadline_at = data.deadline_at
    this.prioritize_at = data.prioritize_at
    this.remind_me_at = data.remind_me_at
    this.review_at = data.review_at
    this.procedure_ids = data.procedure_ids
    this.mental_energy_required = data.mental_energy_required ?? 50
    this.physical_energy_required = data.physical_energy_required ?? 50
    this.task_duration_in_minutes = data.task_duration_in_minutes
    Object.defineProperty(this, 'pres', { value: [], writable: true, enumerable: false })
    Object.defineProperty(this, 'posts', { value: [], writable: true, enumerable: false })
    Object.defineProperty(this, '_refsBuilt', { value: false, writable: true, enumerable: false })
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
  async toggleCompleted() {
    const newCompleteStatus = !this.completed
    const newVal = await useTaskStore().apiUpdate(this.id, { completed: newCompleteStatus })

    if (newCompleteStatus) {
      const starredStore = useTaskStarredStore()
      starredStore.removeCompletedTask(this.id)
    }
    useDependencyStore().boop()
    considerOpeningQuickSortDialog()
    return newVal
  }
  async updateTaskCompletionStatus() {
    const newVal = await useTaskStore().apiUpdate(this.id, { completed: this.completed })
    useDependencyStore().boop()
    considerOpeningQuickSortDialog()
    return newVal
  }
  grabPrereqs(incompleteOnly: boolean): Task[] {
    if (this._refsBuilt) {
      return incompleteOnly
        ? this.pres.filter(r => !r.task.completed).map(r => r.task)
        : this.pres.map(r => r.task)
    }
    const depStore = useDependencyStore()
    const taskStore = useTaskStore()
    const entries = incompleteOnly ? depStore.getIncompletePres(this.id) : depStore.getPres(this.id)
    return entries.map(e => taskStore.mapp.get(e.task_id)).filter(Boolean) as Task[]
  }
  grabPostreqs(incompleteOnly: boolean): Task[] {
    if (this._refsBuilt) {
      return incompleteOnly
        ? this.posts.filter(r => !r.task.completed).map(r => r.task)
        : this.posts.map(r => r.task)
    }
    const depStore = useDependencyStore()
    const taskStore = useTaskStore()
    const entries = incompleteOnly ? depStore.getIncompletePosts(this.id) : depStore.getPosts(this.id)
    return entries.map(e => taskStore.mapp.get(e.task_id)).filter(Boolean) as Task[]
  }
  anyIDsAbove(ids: number[]): Map<number, boolean> {
    const depStore = useDependencyStore()
    const allIDsAbove = depStore.idsBefore(this.id)
    return new Map(ids.map((x) => [x, allIDsAbove.has(x)]))
  }
  anyIDsBelow(ids: number[]): Map<number, boolean> {
    const depStore = useDependencyStore()
    const allIDsBelow = depStore.idsAfter(this.id)
    return new Map(ids.map((x) => [x, allIDsBelow.has(x)]))
  }
  hasRelationTo(id: number) {
    const depStore = useDependencyStore()
    const idsAfter = depStore.idsAfter(this.id)
    const idsBefore = depStore.idsBefore(this.id)
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
      completed: this.completed,
      title: this.title,
      mental_energy_required: this.mental_energy_required,
      physical_energy_required: this.physical_energy_required,
      procedure_ids: this.procedure_ids,
      remind_me_at: this.remind_me_at,
      review_at: this.review_at,
      notes: this.notes,
      list_id: this.list_id,
      schedule_id: this.schedule_id,
      deadline_at: this.deadline_at,
      prioritize_at: this.prioritize_at,
      task_duration_in_minutes: this.task_duration_in_minutes
    }
  }
  d3forceNode(index: number, width = 0, height = 0): d3Node<Task> {
    const depStore = useDependencyStore()
    const postCount = depStore.getPosts(this.id).length
    const preCount = depStore.getPres(this.id).length
    const incompletePostCount = depStore.getIncompletePosts(this.id).length
    const incompletePreCount = depStore.getIncompletePres(this.id).length
    return {
      id: this.id,
      obj: this,
      index: index,
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      radius: Math.min(
        useLocalSettingsStore().maxGraphNodeRadius,
        Math.max(
          (useLocalSettingsStore().hideCompleted
            ? incompletePostCount
            : postCount) ** 2.1,
          incompletePostCount === 0 ? 16 : 8
        )
      ),
      color: this.completed
        ? '#003905'
        : incompletePreCount === 0
          ? 'red'
          : 'gray',
      repel: -1000 / (preCount || 1) ** 2
    }
  }
  get hasPrereqs() {
    return useDependencyStore().getPres(this.id).length > 0
  }
  get hasPostreqs() {
    return useDependencyStore().getPosts(this.id).length > 0
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
      node.expandable = this.grabPrereqs(true).length > 0
      node.lazy = this.grabPrereqs(true).length > 0
      return node
    }
    if (reverse) {
      node.expandable = this.hasPrereqs
      node.lazy = this.hasPrereqs
      return node
    }
    if (hideCompleted) {
      node.expandable = this.grabPostreqs(true).length > 0
      node.lazy = this.grabPostreqs(true).length > 0
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

  hardPrereqTreeNodes(
    reverse = true,
    hideCompleted = false,
    parentKey = ''
  ): SimpleTreeNode<Task>[] {
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
    const depStore = useDependencyStore()
    const title = (number: number) => `${this.title} (${number}/${slices})`
    if (slices <= 1) throw new Error(`Cannot slice a task into ${slices} piece(s).`)
    const prereq_ids = depStore.getPreTaskIds(this.id)
    for (let i = 0; i < prereq_ids.length; i++) {
      await depStore.removeRule(prereq_ids[i]!, this.id)
    }
    const templateTaskSliceObj = (number: number): CreateTaskOptions => ({
      list_id: this.list_id,
      title: title(number),
      notes: this.notes,
      deadline_at: this.deadline_at,
      prioritize_at: this.prioritize_at,
      remind_me_at: this.remind_me_at,
      review_at: this.review_at,
      mental_energy_required: this.mental_energy_required,
      physical_energy_required: this.physical_energy_required
    })
    const newSlices: Array<CreateTaskOptions> = []
    const resultTasks: Array<Task> = []
    const ts = useTaskStore()
    for (let i = 0; i < slices - 1; i++) {
      newSlices.push(templateTaskSliceObj(i + 1))
    }
    for (let i = 0; i < newSlices.length; i++) {
      const tmp = await ts.apiCreate(newSlices[i]!)
      if (typeof tmp !== 'undefined' && tmp !== null) resultTasks.push(new Task(tmp))
    }
    for (let i = 0; i < prereq_ids.length; i++) {
      await depStore.addRule(prereq_ids[i]!, resultTasks[0]!.id)
    }
    for (let i = 1; i < resultTasks.length; i++) {
      await depStore.addRule(resultTasks[i - 1]!.id, resultTasks[i]!.id)
    }
    await depStore.addRule(resultTasks[resultTasks.length - 1]!.id, this.id)
  }
}
