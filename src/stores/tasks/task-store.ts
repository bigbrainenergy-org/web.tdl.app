import type { PiniaPluginContext, StateTree } from 'pinia'
import { defineStore } from 'pinia'
import type {
  AllOptionalTaskProperties,
  CreateTaskOptions,
  TaskState,
  TaskLike
} from './task-interfaces-types'
import { Task } from './task-model'
import type { AxiosResponse } from 'axios'
import { useAuthenticationStore } from '../authentication/pinia-authentication'
import { useAxiosStore } from '../axios-store'
import { retrieve } from './task-utils'
import { hardCheck } from 'src/utils/type-utils'
import { handleError, notifySuccess } from 'src/utils/notification-utils'
import { arrayDelete } from 'src/utils/array-utils'
import { Queue } from 'src/utils/types'
import { Logger } from 'src/utils/d'
import { dontLookAtMe } from './look-i-dont-make-the-rules'
import { dogFoodHarder } from './dogfood'

const TaskStoreLogger = new Logger('Task Store')
const ewww = dontLookAtMe()

export const useTaskStore = defineStore('tasks', {
  state: (): TaskState => ({
    mapp: new Map<number, Task>(),
    _array: []
  }),
  persist: {
    afterRestore: (context: PiniaPluginContext) => {
      const timeToRestore = performance.now();
      (context.store.mapp as Map<number, Task>).forEach((val: Task) => {
          val.fullSyncPosts()
          val.fullSyncPres()
        })
      TaskStoreLogger.log(`afterRestore timings: ${performance.now() - timeToRestore}`)
    },
    paths: ['array'],
    debug: true,
    serializer: {
      serialize: (value: StateTree) => {
        const time = performance.now()
        TaskStoreLogger.log({ 'state value': value })
        const json = JSON.stringify((value._array ?? []).map((x: Task) => x.rawData))
        TaskStoreLogger.log(`SERIALIZE took ${performance.now() - time}`)
        return json
      },
      deserialize: (value: string): StateTree => {
        //TaskStoreLogger.debug('DESERIALIZE: parsing local storage for tasks')
        const time = performance.now()
        const parsed = JSON.parse(value) as TaskLike[]
        const mapp: Map<number, Task> = new Map(parsed.map((x: TaskLike) => [x.id, new Task(x)]))
        const _array = Array.from(mapp.values()) ?? []
        TaskStoreLogger.log(`DESERIALIZE took ${performance.now() - time}`)
        return { _array, mapp }
      }
    }
  },
  actions: {
    updateSingle(data: TaskLike) {
      const newTask = new Task(data)
      const inMap = this.mapp.get(data.id)
      if(!inMap) {
        this.mapp.set(newTask.id, newTask)
        this._array.push(newTask)
      }
      else Object.assign(inMap, newTask)
      return newTask
    },
    update(data: TaskLike[]) {
      data.forEach(x => this.updateSingle(x))
      //TaskStoreLogger.debug({ 'after bulk update': this.array })
      //return this.array
    },
    hardGet(id: number): Task {
      return hardCheck(this.mapp.get(id) as Task, `attempted to access Task with ID of ${id}`)
    },
    commonHeader() {
      try {
        const auth = useAuthenticationStore()
        return { headers: { Authorization: auth.bearerToken } }
      } catch (error) {
        TaskStoreLogger.error(`error in commonHeader: ${error}`)
      }
    },
    api() {
      try {
        return useAxiosStore().axios()
      } catch (error) {
        TaskStoreLogger.error(`error in api dynamic assembly: ${error}`)
        throw new Error(`error in api dynamic assembly: ${error}`)
      }
    },
    apiGetAll() {
      return this.api()
        .get('/tasks', this.commonHeader())
        .then((result: AxiosResponse<TaskLike[]>) => {
          this.update(result.data)
          return result.data
        }, handleError('Error updating local store for Tasks'))
    },
    apiGetId(id: number) {
      return this.api()
        .get(`/tasks/${id}`)
        .then((result: AxiosResponse<TaskLike>) => {
          return this.updateSingle(result.data)
        }, handleError('Error getting '))
    },
    apiCreate(task: CreateTaskOptions) {
      return this.api()
        .post('/tasks', task, this.commonHeader())
        .then((result: AxiosResponse<TaskLike>) => {
          return this.updateSingle(result.data)
        }, handleError('Error creating a task.'))
    },
    /**
     *
     * @param id the task ID
     * @param task an object containing ONLY the properties getting updated.
     * @returns
     */
    async apiUpdate(id: number, task: AllOptionalTaskProperties) {
      try {
        const timings: any = {
          apiUpdateTotal: performance.now(),
          overNetwork: performance.now()
        }
        await this.apiPushChanges(id, task).then((result: AxiosResponse<TaskLike>) => {
            timings.overNetwork = performance.now() - timings.overNetwork
            this.updateSingle(result.data)
            const tmp = this.hardGet(result.data.id)
            ewww.refresh(result.data)
            if(task.hard_prereq_ids) {
              ewww.refreshPres(result.data)
              ewww.grabPres(tmp.id).forEach(x => ewww.refreshPosts(x))
            }
            if(task.hard_postreq_ids) {
              ewww.refreshPosts(result.data)
              ewww.grabPosts(tmp.id).forEach(x => ewww.refreshPres(x))
            }
            if(typeof task.completed !== 'undefined') {
              ewww.updateCompletedStatus(tmp)
            }
            timings.apiUpdateTotal = performance.now() - timings.apiUpdateTotal
            TaskStoreLogger.log(`APIUPDATE TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)
          })
      } catch (e) {
        TaskStoreLogger.error(e)
      }
      //this.array = [...this.array] // deep reactivity more like deep apathy am I right
      return
    },
    async apiPushChanges(id: number, task: AllOptionalTaskProperties) {
      return await this.api().patch<TaskLike>(`/tasks/${id}`, { task }, this.commonHeader())
    },
    apiDelete(id: number) {
      return this.api()
        .delete(`/tasks/${id}`, this.commonHeader())
        .then(() => {
          const theTask = this.hardGet(id)
          //arrayDelete(this.array, theTask, 'id')
          this.mapp.delete(id)
          this._array = this._array.filter(x => x.id !== id)
          notifySuccess('Task was deleted.')
        }, handleError('Error deleting task.'))
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
        ? (t: Task) => {
          const pres = task.hard_prereq_ids.map(retrieve).filter((x) => !x.completed)
          return pres.map((x) => x.id)
        }
        : (t: Task) => {
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
        ? (t: Task) => {
          const posts = task.hard_postreq_ids.map(retrieve).filter((x) => !x.completed)
          return posts.map((x) => x.id)
        }
        : (t: Task) => {
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
      dogFoodHarder().taskLength = this.allTasks.length
      const timings: any = {
        addRuleTotal: performance.now()
      }
      const first = this.hardGet(first_id)
      const second = this.hardGet(second_id)
      // check validity/redundancy, then add the rule and update the first and second record.
      timings.treeGathering = performance.now()
      const ids_before_first = this.idsBefore(first_id)
      const ids_after_first = this.idsAfter(first_id)
      timings.treeGathering = performance.now() - timings.treeGathering
      if (ids_before_first.has(second_id)) {
        throw new Error('Second task is already scheduled to happen before the first.')
      }
      if (ids_after_first.has(second_id)) {
        throw new Error('First task is already scheduled to happen before the second.')
      }
      // const first_payload = { hard_postreq_ids: first.hard_postreq_ids }
      timings.apiUpdate = performance.now()
      return this.apiUpdate(first.id, { hard_postreq_ids: [...first.hard_postreq_ids, second_id] }).then(() => {
        //second.hard_prereq_ids.push(first_id)
        TaskStoreLogger.debug('Added the dependency.')
        timings.apiUpdate = performance.now() - timings.apiUpdate
        timings.addRuleTotal = performance.now() - timings.addRuleTotal
        //TaskStoreLogger.log(`ADDRULE TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)
      }, handleError('Failed to add the dependency.'))
    },
    removeRule(first_id: number, second_id: number) { // BUG: when used for remove Pre on the updateTaskDialog, the pres list isn't updating. addPre works; removePre doesn't. removePost works.
      const first = this.hardGet(first_id)
      const second = this.hardGet(second_id)
      arrayDelete(first.hard_postreq_ids, second_id)
      arrayDelete(second.hard_prereq_ids, first_id)
      const first_payload = { hard_postreq_ids: first.hard_postreq_ids }
      return this.apiUpdate(first.id, first_payload).then(
        () => {
          notifySuccess('Removed the dependency')
          const updatedSecond = this.updateSingle(second)
          // updatedSecond.hard_prereqs.forEach((x) => x.fullSyncPosts())
          // updatedSecond.hard_postreqs.forEach((x) => x.fullSyncPres())
          updatedSecond.fullSyncPosts()
          updatedSecond.fullSyncPres()
        },
        handleError('Failed to remove the dependency.')
      )
    }
  },
  getters: {
    incompleteOnly: (state) => ([...state.mapp.values()] as Task[]).filter((x) => !x.completed),
    layerZero: (state): Task[] => {
      const LayerZeroLogger = new Logger('Layer Zero Getter', '#FFFFFF')
      LayerZeroLogger.log(`layerzero: tasks length = ${state.mapp.size}`)
      const alltasks = ([...state.mapp.values()] as Task[])
      const incompleteTasks = alltasks.filter((x) => !x.completed)
      LayerZeroLogger.log(`layerzero: incomplete tasks length ${alltasks.length} => ${incompleteTasks.length}`)
      const noincompletepres = incompleteTasks.filter(x => {
        try {
          if(ewww.grabIncompletePres(x.id).size > 0) return false
          //if(x.grabPrereqs(true).length > 0) return false
        } catch(ex) {
          LayerZeroLogger.warn({ msg: 'while computing layer zero', ex })
          return false
        }
        return true
      })
      LayerZeroLogger.log(`layerzero: noincompletepres length ${incompleteTasks.length} => ${noincompletepres.length}`)
      return noincompletepres
    },
    allTasks: (state): Task[] => [...state.mapp.values()] as Task[]
  }
})
