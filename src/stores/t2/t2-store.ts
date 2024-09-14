import { defineStore, PiniaPluginContext, StateTree } from 'pinia'
import { CreateTaskOptions, T2State, TaskLike, UpdateTaskLike } from './t2-interfaces-types'
import { T2 } from './t2-model'
import { AxiosResponse } from 'axios'
import { Queue } from 'src/types'
import { Utils } from 'src/util'
import { useAuthenticationStore } from '../authentication/pinia-authentication'
import { useAxiosStore } from '../axios-store'
import { AllOptionalTaskProperties } from '../tasks/task'
import { retrieve } from './t2-utils'

export const useT2Store = defineStore('t2', {
  state: (): T2State => ({
    mapp: new Map<number, T2>(),
    array: [] as T2[]
  }),
  persist: {
    afterRestore: (context: PiniaPluginContext) => {
      const store = context.store
      console.debug({ msg: 'restoring tasks store.', mapp: store.mapp, array: store.array })
      store.mapp = new Map((store.array as T2[]).map((x: T2) => [x.id, x]))
      ;(store.mapp as Map<number, T2>).forEach((val: T2) => {
        val.fullSyncPosts()
        val.fullSyncPres()
      })
      console.debug({ 'after restore': store })
    },
    paths: ['array'],
    debug: true,
    serializer: {
      serialize: (value: StateTree) => {
        return JSON.stringify(value.array.map((x: T2) => x.rawData))
      },
      deserialize: (value: string): StateTree => {
        const parsed = JSON.parse(value) as TaskLike[]
        const array = parsed.map((x: TaskLike) => new T2(x))
        return { array }
      }
    }
  },
  actions: {
    updateSingle(data: TaskLike) {
      const newT2 = new T2(data)
      const index = this.array.findIndex((x) => x.id === newT2.id)
      if (index < 0) {
        this.array.push(newT2)
      } else this.array[index] = newT2
      let inMap = this.mapp.get(newT2.id)
      if (typeof inMap === 'undefined')
        inMap = (this.mapp as Map<number, T2>).set(newT2.id, newT2).get(newT2.id)!
      else Object.assign(inMap, newT2)
      return newT2
    },
    update(data: TaskLike[]) {
      this.array = data.map((x) => new T2(x))
      this.mapp = new Map((this.array as T2[]).map((x: T2) => [x.id, x]))
      ;(this.mapp as Map<number, T2>).forEach((val: T2) => {
        val.fullSyncPosts()
        val.fullSyncPres()
      })
      console.debug({ 'after bulk update': this.array })
      return this.array
    },
    hardGet(id: number): T2 {
      return Utils.hardCheck(this.mapp.get(id) as T2, `attempted to access T2 with ID of ${id}`)
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
      return this.api()
        .get('/tasks', this.commonHeader())
        .then((result: AxiosResponse<TaskLike[]>) => {
          this.update(result.data)
          return result.data
        }, Utils.handleError('Error updating local store for Tasks (T2)'))
    },
    apiGetId(id: number) {
      return this.api()
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
    /**
     *
     * @param id the task ID
     * @param task an object containing ONLY the properties getting updated.
     * @returns
     */
    async apiUpdate(id: number, task: AllOptionalTaskProperties) {
      try {
        const tmp = this.hardGet(id)
        await this.api()
          .patch<TaskLike>(`/tasks/${id}`, { task }, this.commonHeader())
          .then(() => {
            tmp.hard_prereqs.forEach((x) => x.fullSyncPosts())
            tmp.hard_postreqs.forEach((x) => x.fullSyncPres())
            tmp.fullSyncPres()
            tmp.fullSyncPosts()
          })
      } catch (e) {
        console.error(e)
      }
      this.array = [...this.array] // deep reactivity more like deep apathy am I right
      return
    },
    apiDelete(id: number) {
      return this.api()
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
      // const first_payload = { hard_postreq_ids: first.hard_postreq_ids }
      return this.apiUpdate(first.id, { hard_postreq_ids: first.hard_postreq_ids }).then(() => {
        Utils.notifySuccess('Added the dependency.')
      }, Utils.handleError('Failed to add the dependency.'))
    },
    removeRule(first_id: number, second_id: number) {
      const first = this.hardGet(first_id)
      const second = this.hardGet(second_id)
      Utils.arrayDelete(first.hard_postreq_ids, second_id)
      Utils.arrayDelete(second.hard_prereq_ids, first_id)
      const first_payload = { hard_postreq_ids: first.hard_postreq_ids }
      return this.apiUpdate(first.id, first_payload).then(
        Utils.handleSuccess('Removed the dependency.'),
        Utils.handleError('Failed to remove the dependency.')
      )
    }
  },
  getters: {
    incompleteOnly: (state) => state.array.filter((x) => !x.completed),
    layerZero: (state): T2[] =>
      (state.array as T2[]).filter((x) => !x.completed && x.incomplete_prereqs.length === 0)
  }
})
