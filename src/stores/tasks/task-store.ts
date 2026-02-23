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
import { useTaskStarredStore } from './task-starred'
import { useTaskNeedsRefinementStore } from './task-needs-refinement'
import { recalculate } from './task-view'

const TaskStoreLogger = new Logger('Task Store', '#ea00ff')
const ewww = dontLookAtMe()

export const useTaskStore = defineStore('tasks', {
  state: (): TaskState => ({
    array: shallowRef([]) as any, // Use shallowRef for better performance with large arrays
    mapp: new Map(),
    // Version counter to force reactivity when task properties mutate (shallowRef doesn't track deep changes)
    arrayVersion: 0
  }),
  persist: {
    afterRestore: (context: PiniaPluginContext) => {
      TaskStoreLogger.log('afterRestore starting')
      // Rebuild map from array efficiently
      const map = new Map()
      context.store.array.forEach((x: Task) => map.set(x.id, x))
      context.store.mapp = map

      const timeToRestore = performance.now()
      // Pass the map to avoid repeated hardGet calls during refresh
      ewww.refresh_all(context.store.array as Task[], map)
      TaskStoreLogger.log(`eww refresh_all fire timings: ${performance.now() - timeToRestore} ms`)
      TaskStoreLogger.log('afterRestore complete')
      // Refresh starred cache after initial data loading
      // context.store.refreshStarredCache()
    },
    debug: true,
    serializer: {
      serialize: (value: StateTree) => {
        const time = performance.now()
        // Use more efficient serialization - avoid mapping if possible
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
        // Fix: Create new array reference for shallowRef reactivity
        this.array = [...this.array, newTask]
        this.mapp.set(data.id, newTask)
      }
      else {
        Object.assign(inMap, newTask)
        this.arrayVersion++ // Force reactivity after mutating task properties
      }
      return inMap ?? newTask
    },
    update(data: TaskLike[]) {
      TaskStoreLogger.log(`BULK UPDATE: ${data.length} tasks`)
      
      // More efficient bulk update for large datasets
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
      
      // Batch array updates to minimize reactivity overhead
      if (newTasks.length > 0) {
        this.array.push(...newTasks)
      }

      // Force reactivity after bulk mutations
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

          // Initialize ewww store for new task - critical for dependency tracking!
          const ewwwStart = performance.now()
          ewww.refresh(result.data)
          TaskStoreLogger.log(`apiCreate: ewww.refresh took ${performance.now() - ewwwStart}ms`)

          const refineStart = performance.now()
          // Mark newly created tasks as needing refinement by default
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
    /**
     *
     * @param id the task ID
     * @param task an object containing ONLY the properties getting updated.
     * @returns
     */
    async apiUpdate(id: number, task: AllOptionalTaskProperties, options: { skipRecalculate?: boolean } = { skipRecalculate: false }) {
      const timings: any = {
        apiUpdateTotal: performance.now(),
        overNetwork: 0
      }

      const existingTask = this.hardGet(id)

      // Make API call first, update local state only after success
      timings.overNetwork = performance.now()
      const result = await this.apiPushChanges(id, task)
      timings.overNetwork = performance.now() - timings.overNetwork

      // Update local state with server response
      this.updateSingle(result.data)

      // Update ewww for dependency/completion changes
      ewww.refresh(existingTask)
      if (task.hard_prereq_ids) {
        ewww.refreshPres(existingTask)
        ewww.grabPres(existingTask.id).forEach(x => ewww.refreshPosts(x))
      }
      if (task.hard_postreq_ids) {
        ewww.refreshPosts(existingTask)
        ewww.grabPosts(existingTask.id).forEach(x => ewww.refreshPres(x))
      }
      if (typeof task.completed !== 'undefined') {
        ewww.updateCompletedStatus(existingTask)
      }

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
          const theTask = this.hardGet(id)
          this.array = this.array.filter(x => x.id !== id)
          recalculate('apiDelete')
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
          const pres = t.hard_prereq_ids.map(retrieve).filter((x) => !x.completed)
          return pres.map((x) => x.id)
        }
        : (t: Task) => {
          const pres = t.hard_prereq_ids.map(retrieve)
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
          const posts = t.hard_postreq_ids.map(retrieve).filter((x) => !x.completed)
          return posts.map((x) => x.id)
        }
        : (t: Task) => {
          const posts = t.hard_postreq_ids.map(retrieve)
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
    async addRule(first_id: number, second_id: number, options: { skipRecalculate?: boolean, skipBatchOperations?: boolean } = {}) {
      const { skipRecalculate = false, skipBatchOperations = false } = options
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

      // Make API call first
      timings.apiUpdate = performance.now()
      const newPostreqs = [...first.hard_postreq_ids, second_id]
      await this.apiPushChanges(first.id, { hard_postreq_ids: newPostreqs })
      timings.apiUpdate = performance.now() - timings.apiUpdate

      // Update local state only after successful API call
      timings.patchState = performance.now()
      if (!skipBatchOperations) {
        first.hard_postreq_ids = newPostreqs
        second.hard_prereq_ids = [...second.hard_prereq_ids, first_id]
        this.arrayVersion++ // Force reactivity after mutating task properties
      }
      timings.patchState = performance.now() - timings.patchState

      timings.ewwwAddRule = performance.now()
      ewww.addRule(first_id, second_id)
      timings.ewwwAddRule = performance.now() - timings.ewwwAddRule
      TaskStoreLogger.debug(`Added the dependency ${first_id} -> ${second_id}`)

      if (!skipBatchOperations) {
        timings.refreshStarredCache = performance.now()
        this.refreshStarredCache()
        timings.refreshStarredCache = performance.now() - timings.refreshStarredCache
      }

      if (!skipRecalculate && !skipBatchOperations) {
        recalculate('addRule')
      }

      timings.addRuleTotal = performance.now() - timings.addRuleTotal
      TaskStoreLogger.log(`ADDRULE TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)
    },
    removeRule(first_id: number, second_id: number) {
      const first = this.hardGet(first_id)
      const second = this.hardGet(second_id)

      // Create new arrays without the dependency (don't mutate original arrays)
      const new_first_postreqs = first.hard_postreq_ids.filter(id => id !== second_id)
      const first_payload = { hard_postreq_ids: new_first_postreqs }

      return this.apiUpdate(first.id, first_payload).then(
        () => {
          // Only update state after successful API call
          this.$patch(state => {
            first.hard_postreq_ids = new_first_postreqs
            second.hard_prereq_ids = second.hard_prereq_ids.filter(id => id !== first_id)
          })
          this.arrayVersion++ // Force reactivity after mutating task properties
          notifySuccess('Removed the dependency')
          ewww.removeRule(first_id, second_id)
          // Refresh starred cache when task structure changes
          this.refreshStarredCache()
        },
        handleError('Failed to remove the dependency.')
      )
    },
    /**
     * Refresh the starred descendant cache (called when task structure changes)
     */
    refreshStarredCache() {
      const starredStore = useTaskStarredStore()
      starredStore.recomputeDescendantCache(this.array)
    },
    /**
     * String tasks together in order: creates dependencies task[0] -> task[1] -> task[2] -> ...
     * Efficiently batches operations to avoid multiple serializations
     * @param taskIds Array of task IDs to connect in sequence
     */
    async stringTasks(taskIds: number[]) {
      if (taskIds.length < 2) return

      TaskStoreLogger.log(`stringTasks: connecting ${taskIds.length} tasks in sequence`)
      const startTime = performance.now()

      // Create dependencies sequentially with batch mode enabled
      // This only makes API calls and updates ewww, doesn't touch task objects
      for (let i = 1; i < taskIds.length; i++) {
        const first = taskIds[i - 1]!
        const second = taskIds[i]!
        await this.addRule(first, second, { skipRecalculate: true, skipBatchOperations: true })
      }

      // After all API calls complete, sync local task objects from ewww state in a single $patch
      TaskStoreLogger.log('stringTasks: syncing task objects from ewww in single batch')
      const syncStart = performance.now()
      this.$patch(() => {
        for (const taskId of taskIds) {
          const task = this.hardGet(taskId)
          const pres = ewww.grabPres(taskId)
          const posts = ewww.grabPosts(taskId)
          task.hard_prereq_ids = Array.from(pres.keys())
          task.hard_postreq_ids = Array.from(posts.keys())
        }
      })
      this.arrayVersion++ // Force reactivity after mutating task properties
      TaskStoreLogger.log(`stringTasks: sync took ${performance.now() - syncStart}ms`)

      // Refresh cache and recalculate once
      const cacheStart = performance.now()
      this.refreshStarredCache()
      TaskStoreLogger.log(`stringTasks: refreshStarredCache took ${performance.now() - cacheStart}ms`)

      const recalcStart = performance.now()
      recalculate('stringTasks batch complete')
      TaskStoreLogger.log(`stringTasks: recalculate took ${performance.now() - recalcStart}ms`)

      TaskStoreLogger.log(`stringTasks completed in ${performance.now() - startTime}ms`)
    },
  },
  getters: {
    // Use computed for expensive filtering operations
    incompleteOnly: (state) => {
      return computed(() => state.array.filter(x => !x.completed))
    },
    layerZero: (state) => {
      return computed((): Task[] => {
        const LayerZeroLogger = new Logger('Layer Zero Getter', '#FFFFFF')
        const incompleteTasks = state.array.filter(x => !x.completed)
        
        const noincompletepres = incompleteTasks.filter(x => {
          try {
            if(ewww.grabIncompletePres(x.id).size > 0) return false
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
    
    // Add efficient lookup getters
    taskCount: (state) => state.array.length,
    completedCount: (state) => computed(() => state.array.filter(x => x.completed).length),
    
    // Paginated getter for UI performance
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
