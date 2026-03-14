import { defineStore } from 'pinia'
import type { TaskDependency, DependencyEntry } from './dependency-types'
import { useTaskStore } from '../tasks/task-store'
import { useAxiosStore } from '../axios-store'
import { useAuthenticationStore } from '../authentication/pinia-authentication'
import { useTaskStarredStore } from '../tasks/task-starred'
import { useTaskNeedsRefinementStore } from '../tasks/task-needs-refinement'
import { handleError, notifySuccess } from 'src/utils/notification-utils'
import { Queue } from 'src/utils/types'
import { Logger } from 'src/utils/d'
import { recalculate } from '../tasks/task-view'
import { ref, nextTick, markRaw } from 'vue'
import type { Task } from '../tasks/task-model'

const depLogger = new Logger('Dep Store', '#6abc19')
export const initialized = ref(false)

export const useDependencyStore = defineStore('dependencies', {
  state: () => ({
    _deps: [] as TaskDependency[],
    _mapVersion: 0,
    presMap: markRaw(new Map<number, DependencyEntry[]>()),
    postsMap: markRaw(new Map<number, DependencyEntry[]>())
  }),
  persist: {
    paths: ['_deps'],
    afterRestore: (ctx) => {
      depLogger.log('afterRestore: rebuilding maps')
      ctx.store._rebuildMaps()
      ctx.store._buildTaskRefs()
      initialized.value = true

      const taskStore = useTaskStore()
      useTaskStarredStore().initializeFromTasks(taskStore.array)
      useTaskNeedsRefinementStore().initializeFromTasks(taskStore.array)
      recalculate('dep store afterRestore')
    },
    serializer: {
      serialize: (value: any) => JSON.stringify(value._deps ?? []),
      deserialize: (value: string) => ({ _deps: JSON.parse(value) as TaskDependency[] })
    }
  },
  actions: {
    boop() {
      this._mapVersion++
    },

    _rebuildMaps() {
      const start = performance.now()
      const pres = new Map<number, DependencyEntry[]>()
      const posts = new Map<number, DependencyEntry[]>()
      for (const dep of this._deps) {
        // second depends on first: first is a pre of second, second is a post of first
        const preEntries = pres.get(dep.second_id) ?? []
        preEntries.push({ task_id: dep.first_id, degree: dep.degree })
        pres.set(dep.second_id, preEntries)

        const postEntries = posts.get(dep.first_id) ?? []
        postEntries.push({ task_id: dep.second_id, degree: dep.degree })
        posts.set(dep.first_id, postEntries)
      }
      this.presMap = markRaw(pres)
      this.postsMap = markRaw(posts)
      this.boop()
      depLogger.log(`_rebuildMaps: ${this._deps.length} deps in ${performance.now() - start}ms`)
    },

    _addToMaps(dep: TaskDependency) {
      const preEntries = this.presMap.get(dep.second_id) ?? []
      preEntries.push({ task_id: dep.first_id, degree: dep.degree })
      this.presMap.set(dep.second_id, preEntries)

      const postEntries = this.postsMap.get(dep.first_id) ?? []
      postEntries.push({ task_id: dep.second_id, degree: dep.degree })
      this.postsMap.set(dep.first_id, postEntries)
      this.boop()
    },

    _removeFromMaps(first_id: number, second_id: number) {
      const preEntries = this.presMap.get(second_id)
      if (preEntries) {
        const idx = preEntries.findIndex(e => e.task_id === first_id)
        if (idx !== -1) preEntries.splice(idx, 1)
      }
      const postEntries = this.postsMap.get(first_id)
      if (postEntries) {
        const idx = postEntries.findIndex(e => e.task_id === second_id)
        if (idx !== -1) postEntries.splice(idx, 1)
      }
      this.boop()
    },

    _buildTaskRefs() {
      const start = performance.now()
      const taskStore = useTaskStore()

      for (const [, task] of taskStore.mapp) {
        const t = task as Task
        t.pres = []
        t.posts = []
        t._refsBuilt = false
      }

      for (const dep of this._deps) {
        const firstTask = taskStore.mapp.get(dep.first_id) as Task | undefined
        const secondTask = taskStore.mapp.get(dep.second_id) as Task | undefined
        if (firstTask && secondTask) {
          secondTask.pres.push({ task: firstTask, degree: dep.degree })
          firstTask.posts.push({ task: secondTask, degree: dep.degree })
        }
      }

      for (const [, task] of taskStore.mapp) {
        (task as Task)._refsBuilt = true
      }

      depLogger.log(`_buildTaskRefs: ${this._deps.length} deps across ${taskStore.mapp.size} tasks in ${performance.now() - start}ms`)
    },

    _commonHeader() {
      try {
        const auth = useAuthenticationStore()
        return { headers: { Authorization: auth.bearerToken } }
      } catch (error) {
        depLogger.error(`error in commonHeader: ${error}`)
      }
    },

    _api() {
      return useAxiosStore().axios()
    },

    async fetchAll() {
      depLogger.log('fetchAll')
      const result = await this._api().get<TaskDependency[]>('/task_dependencies', this._commonHeader())
      this._deps = result.data
      this._rebuildMaps()
      this._buildTaskRefs()

      // Post-fetch initialization (mirrors old ewww.refresh_all behavior)
      initialized.value = true
      const taskStore = useTaskStore()
      useTaskStarredStore().initializeFromTasks(taskStore.array)
      useTaskNeedsRefinementStore().initializeFromTasks(taskStore.array)

      nextTick(() => {
        recalculate('dep store fetchAll')
      })
    },

    async create(first_id: number, second_id: number, degree?: 1 | 2 | 3 | null) {
      const body: Record<string, any> = { first_id, second_id }
      if (degree != null) body.degree = degree
      const result = await this._api().post<TaskDependency>(
        '/task_dependencies',
        body,
        this._commonHeader()
      )
      const dep = result.data
      this._deps.push(dep)
      this._addToMaps(dep)

      const taskStore = useTaskStore()
      const firstTask = taskStore.mapp.get(first_id) as Task | undefined
      const secondTask = taskStore.mapp.get(second_id) as Task | undefined
      if (firstTask && secondTask) {
        secondTask.pres.push({ task: firstTask, degree: dep.degree })
        firstTask.posts.push({ task: secondTask, degree: dep.degree })
      }

      return dep
    },

    async remove(first_id: number, second_id: number) {
      const dep = this._deps.find(d => d.first_id === first_id && d.second_id === second_id)
      if (!dep) throw new Error(`Dependency not found: ${first_id} -> ${second_id}`)
      try {
        await this._api().delete(`/task_dependencies/${dep.id}`, this._commonHeader())
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error
      }
      const idx = this._deps.indexOf(dep)
      if (idx !== -1) this._deps.splice(idx, 1)
      this._removeFromMaps(first_id, second_id)

      const taskStore = useTaskStore()
      const firstTask = taskStore.mapp.get(first_id) as Task | undefined
      const secondTask = taskStore.mapp.get(second_id) as Task | undefined
      if (secondTask) secondTask.pres = secondTask.pres.filter(r => r.task.id !== first_id)
      if (firstTask) firstTask.posts = firstTask.posts.filter(r => r.task.id !== second_id)
    },

    // --- Lookup methods ---

    getPres(taskId: number): DependencyEntry[] {
      void this._mapVersion
      return this.presMap.get(taskId) ?? []
    },

    getPosts(taskId: number): DependencyEntry[] {
      void this._mapVersion
      return this.postsMap.get(taskId) ?? []
    },

    getPreTaskIds(taskId: number): number[] {
      return this.getPres(taskId).map(e => e.task_id)
    },

    getPostTaskIds(taskId: number): number[] {
      return this.getPosts(taskId).map(e => e.task_id)
    },

    getIncompletePres(taskId: number): DependencyEntry[] {
      const taskStore = useTaskStore()
      return this.getPres(taskId).filter(e => {
        const t = taskStore.mapp.get(e.task_id)
        return t && !t.completed
      })
    },

    getIncompletePosts(taskId: number): DependencyEntry[] {
      const taskStore = useTaskStore()
      return this.getPosts(taskId).filter(e => {
        const t = taskStore.mapp.get(e.task_id)
        return t && !t.completed
      })
    },

    // --- Graph traversal ---

    idsBefore(id: number, incompleteOnly = true): Set<number> {
      const allPres = new Set<number>()
      const queue = new Queue<number>()

      const getPreIds = (taskId: number): number[] => {
        const entries = incompleteOnly ? this.getIncompletePres(taskId) : this.getPres(taskId)
        return entries.map(e => e.task_id)
      }

      queue.enqueueAll(getPreIds(id))
      while (queue.size > 0) {
        const tmpID = queue.dequeue()
        if (allPres.has(tmpID)) continue
        allPres.add(tmpID)
        queue.enqueueAll(getPreIds(tmpID))
      }
      return allPres
    },

    idsAfter(id: number, incompleteOnly = true): Set<number> {
      const allPosts = new Set<number>()
      const queue = new Queue<number>()

      const getPostIds = (taskId: number): number[] => {
        const entries = incompleteOnly ? this.getIncompletePosts(taskId) : this.getPosts(taskId)
        return entries.map(e => e.task_id)
      }

      queue.enqueueAll(getPostIds(id))
      while (queue.size > 0) {
        const tmpID = queue.dequeue()
        if (allPosts.has(tmpID)) continue
        allPosts.add(tmpID)
        queue.enqueueAll(getPostIds(tmpID))
      }
      return allPosts
    },

    // --- High-level operations ---

    async addRule(first_id: number, second_id: number, options: { skipRecalculate?: boolean, degree?: 1 | 2 | 3 | null } = {}) {
      const { skipRecalculate = false, degree } = options
      const timings: any = { addRuleTotal: performance.now() }

      // Validate no cycles
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

      timings.apiCall = performance.now()
      await this.create(first_id, second_id, degree)
      timings.apiCall = performance.now() - timings.apiCall

      const taskStore = useTaskStore()
      taskStore.boop()

      if (!skipRecalculate) {
        taskStore.refreshStarredCache()
        recalculate('addRule')
      }

      timings.addRuleTotal = performance.now() - timings.addRuleTotal
      depLogger.log(`ADDRULE TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)
    },

    async removeRule(first_id: number, second_id: number) {
      await this.remove(first_id, second_id)
      const taskStore = useTaskStore()
      taskStore.boop()
      notifySuccess('Removed the dependency')
      taskStore.refreshStarredCache()
      recalculate('removeRule')
    },

    async updateDegree(first_id: number, second_id: number, degree: 1 | 2 | 3 | null) {
      const dep = this._deps.find(d => d.first_id === first_id && d.second_id === second_id)
      if (!dep) throw new Error(`Dependency not found: ${first_id} -> ${second_id}`)

      const body = { degree }
      await this._api().patch(`/task_dependencies/${dep.id}`, body, this._commonHeader())

      dep.degree = degree

      // Update maps
      const preEntries = this.presMap.get(second_id)
      if (preEntries) {
        const entry = preEntries.find(e => e.task_id === first_id)
        if (entry) entry.degree = degree
      }
      const postEntries = this.postsMap.get(first_id)
      if (postEntries) {
        const entry = postEntries.find(e => e.task_id === second_id)
        if (entry) entry.degree = degree
      }

      // Update task refs
      const taskStore = useTaskStore()
      const firstTask = taskStore.mapp.get(first_id) as Task | undefined
      const secondTask = taskStore.mapp.get(second_id) as Task | undefined
      if (secondTask) {
        const ref = secondTask.pres.find(r => r.task.id === first_id)
        if (ref) ref.degree = degree
      }
      if (firstTask) {
        const ref = firstTask.posts.find(r => r.task.id === second_id)
        if (ref) ref.degree = degree
      }
      this.boop()
    },

    async stringTasks(taskIds: number[], degree?: 1 | 2 | 3 | null) {
      if (taskIds.length < 2) return

      depLogger.log(`stringTasks: connecting ${taskIds.length} tasks in sequence`)
      const startTime = performance.now()

      for (let i = 1; i < taskIds.length; i++) {
        const first = taskIds[i - 1]!
        const second = taskIds[i]!
        await this.addRule(first, second, { skipRecalculate: true, degree })
      }

      const taskStore = useTaskStore()
      taskStore.boop()
      taskStore.refreshStarredCache()
      recalculate('stringTasks batch complete')
      depLogger.log(`stringTasks completed in ${performance.now() - startTime}ms`)
    },

    removeTaskEntries(taskId: number) {
      // Clean up task refs bidirectionally
      const taskStore = useTaskStore()
      const deletedTask = taskStore.mapp.get(taskId) as Task | undefined
      if (deletedTask) {
        for (const ref of deletedTask.pres) {
          ref.task.posts = ref.task.posts.filter(r => r.task.id !== taskId)
        }
        for (const ref of deletedTask.posts) {
          ref.task.pres = ref.task.pres.filter(r => r.task.id !== taskId)
        }
        deletedTask.pres = []
        deletedTask.posts = []
      }

      // Remove from _deps array
      this._deps = this._deps.filter(d => d.first_id !== taskId && d.second_id !== taskId)

      // Remove as a key from both maps
      this.presMap.delete(taskId)
      this.postsMap.delete(taskId)

      // Remove from other tasks' entry arrays
      for (const [, entries] of this.presMap) {
        const idx = entries.findIndex(e => e.task_id === taskId)
        if (idx !== -1) entries.splice(idx, 1)
      }
      for (const [, entries] of this.postsMap) {
        const idx = entries.findIndex(e => e.task_id === taskId)
        if (idx !== -1) entries.splice(idx, 1)
      }
      this.boop()
    },

  }
})
