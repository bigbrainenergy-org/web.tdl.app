import type { PiniaPluginContext, StateTree } from 'pinia'
import { defineStore } from 'pinia'
import { shallowRef, computed } from 'vue'
import type {
  AllOptionalTaskProperties,
  CreateTaskOptions,
  TaskState,
  TaskLike
} from './task-interfaces-types'
import { Task } from './task-model'
import type { AxiosError, AxiosResponse } from 'axios'
import { useAuthenticationStore } from '../authentication/pinia-authentication'
import { useAxiosStore } from '../axios-store'
import { hardCheck } from 'src/utils/type-utils'
import { handleError, notifySuccess } from 'src/utils/notification-utils'
import { Logger } from 'src/utils/d'
import { useTaskStarredStore } from './task-starred'
import { useTaskNeedsRefinementStore } from './task-needs-refinement'
import { recalculate } from './task-view'
import { useDependencyStore } from '../dependencies/dependency-store'

const TaskStoreLogger = new Logger('Task Store', '#ea00ff')

export const useTaskStore = defineStore('tasks', {
  state: (): TaskState => ({
    array: shallowRef([]) as any,
    mapp: new Map(),
    arrayVersion: 0
  }),
  persist: {
    afterRestore: (context: PiniaPluginContext) => {
      TaskStoreLogger.log('afterRestore starting')
      const map = new Map()
      context.store.array.forEach((x: Task) => map.set(x.id, x))
      context.store.mapp = map
      TaskStoreLogger.log('afterRestore complete')
    },
    debug: true,
    serializer: {
      serialize: (value: StateTree) => {
        const time = performance.now()
        const tasks = value.array ?? []
        const json = JSON.stringify(tasks.map((x: Task) => x.rawData))
        TaskStoreLogger.log(`SERIALIZE took ${performance.now() - time}ms for ${tasks.length} tasks`)
        return json
      },
      deserialize: (value: string): StateTree => {
        const time = performance.now()
        const parseStart = performance.now()
        const rawTasks = JSON.parse(value) as TaskLike[]
        TaskStoreLogger.log(`JSON.parse took ${performance.now() - parseStart}ms`)

        const taskCreationStart = performance.now()
        const array = rawTasks.map(x => new Task(x))
        TaskStoreLogger.log(`Task creation took ${performance.now() - taskCreationStart}ms for ${array.length} tasks`)

        const shallowRefStart = performance.now()
        const result = { array: shallowRef(array) }
        TaskStoreLogger.log(`shallowRef creation took ${performance.now() - shallowRefStart}ms`)

        TaskStoreLogger.log(`DESERIALIZE took ${performance.now() - time}ms for ${array.length} tasks`)
        TaskStoreLogger.log('DESERIALIZE returning state to Pinia...')
        return result
      }
    }
  },
  actions: {
    updateSingle(data: TaskLike) {
      const newTask = new Task(data)
      const inMap = this.mapp.get(data.id)
      if(!inMap) {
        this.array = [...this.array, newTask]
        this.mapp.set(data.id, newTask)
      }
      else {
        Object.assign(inMap, newTask)
        this.arrayVersion++
      }
      return inMap ?? newTask
    },
    update(data: TaskLike[]) {
      TaskStoreLogger.log(`BULK UPDATE: ${data.length} tasks`)

      const newTasks: Task[] = []
      const updatedTasks: Task[] = []

      data.forEach(x => {
        const newTask = new Task(x)
        const existing = this.mapp.get(x.id) as Task | undefined
        if(!existing) {
          newTasks.push(newTask)
          this.mapp.set(x.id, newTask)
        } else {
          Object.assign(existing, newTask)
          updatedTasks.push(existing)
        }
      })

      if (newTasks.length > 0) {
        this.array.push(...newTasks)
      }

      if (updatedTasks.length > 0 || newTasks.length > 0) {
        this.arrayVersion++
      }

      TaskStoreLogger.log(`Added ${newTasks.length}, updated ${updatedTasks.length} tasks`)
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
      TaskStoreLogger.log('API GET ALL')
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
    apiCreate(task: CreateTaskOptions, { skipRecalculate = false }: { skipRecalculate?: boolean } = {}) {
      const createStart = performance.now()
      TaskStoreLogger.log('apiCreate: starting POST...')
      return this.api()
        .post('/tasks', task, this.commonHeader())
        .then((result: AxiosResponse<TaskLike>) => {
          TaskStoreLogger.log(`apiCreate: POST completed in ${performance.now() - createStart}ms`)

          const updateStart = performance.now()
          const r = this.updateSingle(result.data)
          TaskStoreLogger.log(`apiCreate: updateSingle took ${performance.now() - updateStart}ms`)

          const refineStart = performance.now()
          useTaskNeedsRefinementStore().markNeedsRefinement(result.data.id)
          TaskStoreLogger.log(`apiCreate: markNeedsRefinement took ${performance.now() - refineStart}ms`)

          notifySuccess('Task was created')
          if (!skipRecalculate) {
            const recalcStart = performance.now()
            recalculate('apicreate')
            TaskStoreLogger.log(`apiCreate: recalculate took ${performance.now() - recalcStart}ms`)
          }
          TaskStoreLogger.log(`apiCreate: total .then() took ${performance.now() - createStart}ms`)
          return r
        }, handleError('Error creating a task.'))
    },
    async apiUpdate(id: number, task: AllOptionalTaskProperties, options: { skipRecalculate?: boolean } = { skipRecalculate: false }) {
      const timings: any = {
        apiUpdateTotal: performance.now(),
        overNetwork: 0
      }

      const existingTask = this.hardGet(id)

      timings.overNetwork = performance.now()
      const result = await this.apiPushChanges(id, task)
      timings.overNetwork = performance.now() - timings.overNetwork

      this.updateSingle(result.data)

      if (!options.skipRecalculate) recalculate('apiUpdate')

      timings.apiUpdateTotal = performance.now() - timings.apiUpdateTotal
      TaskStoreLogger.log(`APIUPDATE TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)
    },
    async apiPushChanges(id: number, task: AllOptionalTaskProperties) {
      const result = await this.api().patch<TaskLike>(`/tasks/${id}`, { task }, this.commonHeader())
      return result
    },
    apiDelete(id: number) {
      return this.api()
        .delete(`/tasks/${id}`, this.commonHeader())
        .then(() => {
          this.array = this.array.filter(x => x.id !== id)
          this.mapp.delete(id)
          useDependencyStore().removeTaskEntries(id)
          recalculate('apiDelete')
          notifySuccess('Task was deleted.')
        }, (error: AxiosError) => {
          if (error?.response?.status === 404) {
            this.array = this.array.filter(x => x.id !== id)
            this.mapp.delete(id)
            useDependencyStore().removeTaskEntries(id)
            recalculate('apiDelete')
            notifySuccess('Task was deleted.')
            return
          }
          handleError('Error deleting task.')(error)
        })
    },
    apiBulkDelete(ids: number[]) {
      const idSet = new Set(ids)
      const removeLocally = () => {
        this.array = this.array.filter(x => !idSet.has(x.id))
        const depStore = useDependencyStore()
        for (const id of ids) {
          this.mapp.delete(id)
          depStore.removeTaskEntries(id)
        }
        recalculate('apiBulkDelete')
      }
      return Promise.all(
        ids.map(id =>
          this.api().delete(`/tasks/${id}`, this.commonHeader())
            .catch((error: AxiosError) => {
              if (error?.response?.status === 404) return
              throw error
            })
        )
      ).then(() => {
        removeLocally()
        notifySuccess(`Deleted ${ids.length} tasks.`)
      }, handleError('Error bulk-deleting tasks.'))
    },
    refreshStarredCache() {
      const starredStore = useTaskStarredStore()
      starredStore.recomputeDescendantCache(this.array)
    },
  },
  getters: {
    incompleteOnly: (state) => {
      return computed(() => state.array.filter(x => !x.completed))
    },
    layerZero: (state) => {
      return computed((): Task[] => {
        const LayerZeroLogger = new Logger('Layer Zero Getter', '#FFFFFF')
        const depStore = useDependencyStore()
        const incompleteTasks = state.array.filter(x => !x.completed)

        const noincompletepres = incompleteTasks.filter(x => {
          try {
            if(depStore.getIncompletePres(x.id).length > 0) return false
          } catch(ex) {
            LayerZeroLogger.warn({ msg: 'while computing layer zero', ex })
            return false
          }
          return true
        })

        LayerZeroLogger.log(`layerzero: (all: ${state.array.length}) => (incomplete: ${incompleteTasks.length}) => (noincompletepres: ${noincompletepres.length})`)
        return noincompletepres
      })
    },

    taskCount: (state) => state.array.length,
    completedCount: (state) => computed(() => state.array.filter(x => x.completed).length),

    paginatedTasks: (state) => (page: number = 0, pageSize: number = 200) => {
      const start = page * pageSize
      const end = start + pageSize
      return state.array.slice(start, end)
    },

    reminders: (state) => {
      return computed(() => {
        const incompleteTasks = state.array.filter(x => !x.completed)
        const now = new Date()
        const reminderTasks: Task[] = []
        const overdueTasks: Task[] = []
        incompleteTasks.forEach(x => {
          if(x.remind_me_at && new Date(x.remind_me_at) < now) reminderTasks.push(x)
          if(x.deadline_at && new Date(x.deadline_at) < now) overdueTasks.push(x)
        })
        const count = reminderTasks.length + overdueTasks.length
        return { reminderTasks, overdueTasks, count }
      })
    }
  }
})
