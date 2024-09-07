import { defineStore, PiniaPluginContext } from 'pinia'
import { Utils } from 'src/util'
import { useAxiosStore } from './axios-store'
import { useAuthenticationStore } from './authentication/pinia-authentication'
import { AxiosResponse } from 'axios'
import { Queue } from 'src/types'
import { useRepo } from 'pinia-orm'
import { ListRepo } from './lists/list'
import { SimpleTreeNode } from 'src/quasar-interfaces'
import { ExpandedStateRepo } from './task-meta/expanded-state'
import { ProcedureRepo } from './procedures/procedure'

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
  procedure_ids?: number[]
  mental_energy_required?: number
  physical_energy_required?: number
}

export interface TaskLike {
  hard_prereq_ids: number[]
  hard_postreq_ids: number[]
  hard_prereqs: TaskLike[]
  hard_postreqs: TaskLike[]
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
}

export interface UpdateTaskLike {
  id: number
  payload: {
    task: TaskLike
  }
}

const retrieve = (id: number): T2 => useTasksStore().hardGet(id)
export const incompleteOnly = (t: TaskLike) => !t.completed

export class T2 implements TaskLike {
  hard_prereq_ids: number[]
  hard_postreq_ids: number[]
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
    this.hard_prereq_ids = data.hard_prereq_ids
    this.hard_postreq_ids = data.hard_postreq_ids
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
  get hard_prereqs() {
    return this.hard_prereq_ids.map(retrieve)
  }
  get hard_postreqs() {
    return this.hard_postreq_ids.map(retrieve)
  }
  get list() {
    const id = this.list_id
    if (typeof id === 'undefined') return undefined
    return useRepo(ListRepo).find(id) ?? undefined
  }
  get procedures() {
    const ids = this.procedure_ids
    if (typeof ids === 'undefined') return []
    return useRepo(ProcedureRepo).where((x) => ids.includes(x.id))
  }
  get incomplete_postreqs() {
    return this.hard_postreqs.filter(incompleteOnly)
  }
  get incomplete_prereqs() {
    return this.hard_prereqs.filter(incompleteOnly)
  }
  toggleCompleted() {
    this.completed = !this.completed
    return useTasksStore().apiUpdate(this)
  }
  grabPrereqs(incompleteOnly: boolean) {
    return incompleteOnly ? this.incomplete_prereqs : this.hard_prereqs
  }
  grabPostreqs(incompleteOnly: boolean) {
    return incompleteOnly ? this.incomplete_postreqs : this.hard_postreqs
  }
  anyIDsAbove(ids: number[]): Map<number, boolean> {
    const ts = useTasksStore()
    const allIDsAbove = ts.idsBefore(this.id)
    return new Map(ids.map((x) => [x, allIDsAbove.has(x)]))
  }
  anyIDsBelow(ids: number[]): Map<number, boolean> {
    const ts = useTasksStore()
    const allIDsBelow = ts.idsAfter(this.id)
    return new Map(ids.map((x) => [x, allIDsBelow.has(x)]))
  }
  hasRelationTo(id: number) {
    const ts = useTasksStore()
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
  get hasPrereqs() {
    return this.hard_prereq_ids.length > 0
  }
  get hasPostreqs() {
    return this.hard_postreq_ids.length > 0
  }
  get expanded_state() {
    return useRepo(ExpandedStateRepo).getByTaskID(this.id)
  }
  treeNode(reverse = false, hideCompleted = false, parentKey = ''): SimpleTreeNode<T2> {
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
  ): SimpleTreeNode<T2>[] {
    return this.grabPostreqs(hideCompleted).map((x) =>
      x.treeNode(reverse, hideCompleted, parentKey)
    )
  }

  hardPrereqTreeNodes(reverse = true, hideCompleted = false, parentKey = ''): SimpleTreeNode<T2>[] {
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
      useTasksStore().removeRule(prereq_ids[i], this.id)
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
    const resultTasks: Array<T2> = []
    const ts = useTasksStore()
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

interface T2State {
  mapp: Map<number, T2>
  array: T2[]
}

export const useTasksStore = defineStore('t2', {
  state: (): T2State => ({
    mapp: new Map<number, T2>(),
    array: []
  }),
  persist: {
    afterRestore: (context: PiniaPluginContext) => {
      const store = context.store
      console.log({ msg: 'restoring tasks store.', store, arr: store.array })
      store.array.forEach((x: T2) => store.mapp.set(x.id, x))
    }
  },
  actions: {
    updateSingle(data: TaskLike) {
      const newT2 = new T2(data)
      Utils.arrayUpdate(this.array, newT2, 'id')
      this.mapp.set(newT2.id, newT2)
      return newT2
    },
    update(data: TaskLike[]) {
      this.array = data.map((x) => new T2(x))
      this.array.forEach((x) => {
        this.mapp.set(x.id, x)
      })
      return this.array
    },
    hardGet(id: number): T2 {
      return Utils.hardCheck((this.mapp as Map<number, T2>).get(id))
    },
    commonHeader() {
      try {
        const auth = useAuthenticationStore()
        return { headers: { Authorization: auth.bearerToken } }
      } catch (error) {
        console.error(`error in commonHeader: ${error}`)
      }
    },
    api() {
      try {
        return useAxiosStore().axios()
      } catch (error) {
        console.error(`error in api dynamic assembly: ${error}`)
        throw new Error(`error in api dynamic assembly: ${error}`)
      }
    },
    apiGetAll() {
      this.api()
        .get('/tasks', this.commonHeader())
        .then((result: AxiosResponse<TaskLike[]>) => {
          this.update(result.data)
          return result.data
        }, Utils.handleError('Error updating local store for Tasks (T2)'))
    },
    apiGetId(id: number) {
      this.api()
        .get(`/tasks/${id}`)
        .then((result: AxiosResponse<TaskLike>) => {
          return this.updateSingle(result.data)
        }, Utils.handleError('Error getting '))
    },
    apiCreate(task: CreateTaskOptions) {
      return this.api()
        .post('/tasks', task, this.commonHeader())
        .then((result: AxiosResponse<TaskLike>) => {
          return this.updateSingle(result.data)
        }, Utils.handleError('Error creating a task.'))
    },
    apiUpdate(task: TaskLike) {
      const payload: UpdateTaskLike = {
        id: task.id,
        payload: { task }
      }
      return this.api()
        .put(`/tasks/${task.id}`, payload, this.commonHeader())
        .then((result: AxiosResponse<TaskLike>) => {
          return this.updateSingle(result.data)
        }, Utils.handleError('Error updating task.'))
    },
    apiDelete(id: number) {
      this.api()
        .delete(`/tasks/${id}`, this.commonHeader())
        .then(() => {
          const theTask = this.hardGet(id)
          Utils.arrayDelete(this.array, theTask, 'id')
          this.mapp.delete(id)
          Utils.notifySuccess('Task was deleted.')
        }, Utils.handleError('Error deleting task.'))
    },
    /**
     *
     * @param id the task ID to begin the traversal
     * @param incompleteOnly stop traversal on completed tasks? defaults to true
     * @returns a Set<number> of task IDs that are ordered before the task ID given as input
     */
    idsBefore(id: number, incompleteOnly = true) {
      const task = this.hardGet(id)
      const allPres = new Set<number>()
      const queue = new Queue<number>()
      const preIDs = incompleteOnly
        ? (t: T2) => {
            const pres = task.hard_prereq_ids.map(retrieve).filter((x) => !x.completed)
            return pres.map((x) => x.id)
          }
        : (t: T2) => {
            const pres = task.hard_prereq_ids.map(retrieve)
            return pres.map((x) => x.id)
          }
      const thisPres = preIDs(task)
      queue.enqueueAll(thisPres)
      while (queue.size > 0) {
        const tmpID = queue.dequeue()
        if (allPres.has(tmpID)) continue
        allPres.add(tmpID)
        const tmpTask = this.hardGet(tmpID)
        queue.enqueueAll(preIDs(tmpTask))
      }
      return allPres
    },
    idsAfter(id: number, incompleteOnly = true) {
      const task = this.hardGet(id)
      const allPosts = new Set<number>()
      const queue = new Queue<number>()
      const postIDs = incompleteOnly
        ? (t: T2) => {
            const posts = task.hard_postreq_ids.map(retrieve).filter((x) => !x.completed)
            return posts.map((x) => x.id)
          }
        : (t: T2) => {
            const posts = task.hard_postreq_ids.map(retrieve)
            return posts.map((x) => x.id)
          }
      const thisPosts = postIDs(task)
      queue.enqueueAll(thisPosts)
      while (queue.size > 0) {
        const tmpID = queue.dequeue()
        if (allPosts.has(tmpID)) continue
        allPosts.add(tmpID)
        const tmpTask = this.hardGet(tmpID)
        queue.enqueueAll(postIDs(tmpTask))
      }
      return allPosts
    },
    addRule(first_id: number, second_id: number) {
      const first = this.hardGet(first_id)
      const second = this.hardGet(second_id)
      // check validity/redundancy, then add the rule and update the first and second record.
      const ids_before_first = this.idsBefore(first_id)
      const ids_after_first = this.idsAfter(first_id)
      if (ids_before_first.has(second_id)) {
        throw new Error('Second task is already scheduled to happen before the first.')
      }
      if (ids_after_first.has(second_id)) {
        throw new Error('First task is already scheduled to happen before the second.')
      }
      first.hard_postreq_ids.push(second_id)
      second.hard_prereq_ids.push(first_id)
      return this.apiUpdate(first).then(
        Utils.handleSuccess('Added the dependency.'),
        Utils.handleError('Failed to add the dependency.')
      )
    },
    removeRule(first_id: number, second_id: number) {
      const first = this.hardGet(first_id)
      const second = this.hardGet(second_id)
      Utils.arrayDelete(first.hard_postreq_ids, second_id)
      Utils.arrayDelete(second.hard_prereq_ids, first_id)
      this.apiUpdate(first).then(
        Utils.handleSuccess('Removed the dependency.'),
        Utils.handleError('Failed to remove the dependency.')
      )
    }
  },
  getters: {
    incompleteOnly: (state) => state.array.filter((x) => !x.completed),
    layerZero: (state) =>
      state.array.filter((x) => !x.completed && x.incomplete_prereqs.length === 0)
  }
})
