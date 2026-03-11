import { defineStore } from 'pinia'
import { type TaskLike } from './task-interfaces-types'
import { useTaskStore } from './task-store'
import { recalculate } from './task-view'

const STAR_MARKER = '!!STAR'

/**
 * Add !!STAR marker to notes if not present
 */
function addStarMarker(notes: string | undefined): string {
  if (!notes) return STAR_MARKER
  if (notes.includes(STAR_MARKER)) return notes
  return `${STAR_MARKER}\n${notes}`
}

/**
 * Remove !!STAR marker from notes
 */
function removeStarMarker(notes: string | undefined): string {
  if (!notes) return ''
  return notes.replace(new RegExp(`${STAR_MARKER}\\n?`, 'g'), '').trim()
}

export const useTaskStarredStore = defineStore('task-starred', {
  state: () => ({
    // Array for localStorage persistence (fast initial load)
    _starredIds: [] as number[],
    // Set for O(1) performance (synced from task notes on refresh_all)
    _starredSet: new Set<number>(),
    // Cache for count of starred descendants per task (for weighted prioritization)
    starredDescendantCounts: new Map<number, number>(),
    _cacheTimeout: null as any
  }),

  getters: {
    // Return the performance Set for external consumers
    ids: (state): Set<number> => state._starredSet
  },

  actions: {
    /**
     * Initialize Set from localStorage array (called after hydration)
     */
    _syncSetFromArray() {
      this._starredSet = new Set(this._starredIds)
    },

    /**
     * Sync from task notes - the DB source of truth (called during refresh_all)
     */
    initializeFromTasks(tasks: TaskLike[]) {
      const starredIds = tasks.filter(t => t.notes?.includes(STAR_MARKER)).map(t => t.id)
      this._starredIds = starredIds
      this._starredSet = new Set(starredIds)
    },

    /**
     * Add a task to the starred set and update its notes
     */
    star(taskId: number) {
      if (!this._starredSet.has(taskId)) {
        this._starredIds.push(taskId)
        this._starredSet.add(taskId)
        // Update notes in DB (only if marker not already present)
        const task = useTaskStore().mapp.get(taskId)
        if (task) {
          const newNotes = addStarMarker(task.notes)
          if (newNotes !== task.notes) {
            useTaskStore().apiUpdate(taskId, { notes: newNotes }, { skipRecalculate: true })
          }
        }
      }
      this.invalidateDescendantCache()
      recalculate('star')
    },

    /**
     * Remove a task from the starred set and update its notes
     */
    unstar(taskId: number) {
      if (this._starredSet.has(taskId)) {
        const index = this._starredIds.indexOf(taskId)
        if (index !== -1) this._starredIds.splice(index, 1)
        this._starredSet.delete(taskId)
        // Update notes in DB (only if marker not already present)
        const task = useTaskStore().mapp.get(taskId)
        if (task) {
          const newNotes = removeStarMarker(task.notes)
          if (newNotes !== task.notes) {
            useTaskStore().apiUpdate(taskId, { notes: newNotes }, { skipRecalculate: true })
          }
        }
      }
      this.invalidateDescendantCache()
      recalculate('unstar')
    },
    
    /**
     * Toggle starred status of a task
     */
    toggle(taskId: number) {
      if (this.isStarred(taskId)) {
        this.unstar(taskId)
      } else {
        this.star(taskId)
      }
    },
    
    /**
     * Check if a task is starred - O(1) performance
     */
    isStarred(taskId: number): boolean {
      return this._starredSet.has(taskId)
    },
    
    /**
     * Get the count of starred descendants for a task
     */
    getStarredDescendantCount(taskId: number): number {
      return this.starredDescendantCounts.get(taskId) ?? 0
    },
    
    /**
     * Check if a task has starred descendants (cached for performance)
     */
    hasStarredDescendants(taskId: number): boolean {
      return this.getStarredDescendantCount(taskId) > 0
    },
    
    /**
     * Check if a task should be highlighted (starred or has starred descendants)
     */
    shouldHighlight(taskId: number): boolean {
      return this.isStarred(taskId) || this.hasStarredDescendants(taskId)
    },
    
    /**
     * Get the total "star weight" of a task (1 if starred + count of starred descendants)
     */
    getStarWeight(taskId: number): number {
      const baseWeight = this.isStarred(taskId) ? 1 : 0
      const descendantWeight = this.getStarredDescendantCount(taskId)
      return baseWeight + descendantWeight
    },
    
    /**
     * Remove completed tasks from starred set
     */
    removeCompletedTask(taskId: number) {
      this.unstar(taskId) // Use unstar method for consistency
    },

    computeDescendants(taskId: number, taskMap: Map<number, TaskLike>, visited = new Set<number>()) {
      const cached = this.starredDescendantCounts.get(taskId)
      if (cached !== undefined) return cached

      if (visited.has(taskId)) {
        console.log('Cycle detected for task', taskId, taskMap.get(taskId)?.title)
        return 0
      }
      visited.add(taskId)

      const task = taskMap.get(taskId)
      if (!task) return 0

      const posts = (task as TaskLike & { posts: Array<{ task: TaskLike; degree: number }> }).posts
      let totalCount = 0
      for (const ref of posts) {
        if (ref.task.completed) continue

        if (this._starredSet.has(ref.task.id)) totalCount += 1

        totalCount += this.computeDescendants(ref.task.id, taskMap, visited)
      }

      this.starredDescendantCounts.set(taskId, totalCount)

      return totalCount
    },
    
    /**
     * Recompute the descendant cache (call when task structure or starred set changes)
     * Note: This method expects to be called externally to avoid circular dependency
     */
    recomputeDescendantCache(taskArray: TaskLike[]) {
      this.starredDescendantCounts.clear()
      
      // Only recompute if we have starred tasks
      if (this._starredSet.size === 0) return
      
      // Create O(1) task lookup map
      const taskMap = new Map<number, TaskLike>()
      for (const task of taskArray) {
        taskMap.set(task.id, task)
      }

      const visited = new Set<number>()
      
      // Compute starred descendant counts for all tasks
      for (const task of taskArray) {
        this.computeDescendants(task.id, taskMap, visited)
      }
    },
    
    invalidateDescendantCache() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      clearTimeout(this._cacheTimeout)
      this._cacheTimeout = setTimeout(() => {
        this.starredDescendantCounts.clear()
        this._cacheTimeout = null
      }, 150)
    }
  },

  persist: {
    key: 'task-starred',
    paths: ['_starredIds'],
    afterRestore: (ctx) => {
      ctx.store._syncSetFromArray()
    }
  }
})