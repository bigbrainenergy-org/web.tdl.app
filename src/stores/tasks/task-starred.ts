import { defineStore } from 'pinia'
import { type TaskLike } from './task-interfaces-types'
import { dontLookAtMe } from './look-i-dont-make-the-rules'
import { useTaskStore } from './task-store'

export const useTaskStarredStore = defineStore('task-starred', {
  state: () => ({
    // Use array for persistence, convert to Set in getters
    _starredIds: [] as number[],
    // Maintain Set for O(1) performance (not persisted)
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
     * Initialize the Set from the persisted array (called after hydration)
     */
    _syncSetFromArray() {
      this._starredSet = new Set(this._starredIds)
    },
    
    /**
     * Add a task to the starred set
     */
    star(taskId: number) {
      if (!this._starredSet.has(taskId)) {
        this._starredIds.push(taskId)
        this._starredSet.add(taskId)
      }
      this.invalidateDescendantCache()
    },
    
    /**
     * Remove a task from the starred set
     */
    unstar(taskId: number) {
      if (this._starredSet.has(taskId)) {
        const index = this._starredIds.indexOf(taskId)
        if (index !== -1) {
          this._starredIds.splice(index, 1)
        }
        this._starredSet.delete(taskId)
      }
      this.invalidateDescendantCache()
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
      // Check if already computed
      const cached = this.starredDescendantCounts.get(taskId)
      if (cached !== undefined) return cached
      
      // Prevent cycles
      if (visited.has(taskId)) {
        console.log('Cycle detected for task', taskId, taskMap.get(taskId)?.title)
        return 0
      }
      visited.add(taskId)
      
      const task = taskMap.get(taskId)
      if (!task) return 0
      
      // Accumulate starred descendants from all direct postreqs
      // Use task.hard_postreq_ids directly to avoid reactive ewww store access
      let totalCount = 0
      for (const postreqId of task.hard_postreq_ids) {
        // Skip completed tasks to match incomplete posts behavior
        const postreqTask = taskMap.get(postreqId)
        if(!postreqTask || postreqTask.completed) continue
        
        // If this postreq is starred, count it
        if (this._starredSet.has(postreqId)) totalCount += 1
        
        // Add all starred descendants of this postreq (recursive)
        totalCount += this.computeDescendants(postreqId, taskMap, visited)
      }
      
      // Cache the result (including zero values)
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
      clearTimeout(this._cacheTimeout)
      this._cacheTimeout = setTimeout(() => {
        this.starredDescendantCounts.clear()
        this._cacheTimeout = null
      }, 150)
    }
  },
  
  persist: {
    key: 'task-starred',
    // Persist the array, which can be properly serialized
    paths: ['_starredIds'],
    // Sync Set from array after hydration
    afterRestore: (ctx) => {
      ctx.store._syncSetFromArray()
    }
  }
})