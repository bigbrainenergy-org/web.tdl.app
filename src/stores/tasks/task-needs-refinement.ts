import { defineStore } from 'pinia'

export const useTaskNeedsRefinementStore = defineStore('task-needs-refinement', {
  state: () => ({
    // Use array for persistence, convert to Set in getters
    _needsRefinementIds: [] as number[],
    // Maintain Set for O(1) performance (not persisted)
    _needsRefinementSet: new Set<number>()
  }),

  getters: {
    // Return the performance Set for external consumers
    ids: (state): Set<number> => state._needsRefinementSet
  },

  actions: {
    /**
     * Initialize the Set from the persisted array (called after hydration)
     */
    _syncSetFromArray() {
      this._needsRefinementSet = new Set(this._needsRefinementIds)
    },

    /**
     * Mark a task as needing refinement
     */
    markNeedsRefinement(taskId: number) {
      if (!this._needsRefinementSet.has(taskId)) {
        this._needsRefinementIds.push(taskId)
        this._needsRefinementSet.add(taskId)
      }
    },

    /**
     * Unmark a task as needing refinement
     */
    unmarkNeedsRefinement(taskId: number) {
      if (this._needsRefinementSet.has(taskId)) {
        const index = this._needsRefinementIds.indexOf(taskId)
        if (index !== -1) {
          this._needsRefinementIds.splice(index, 1)
        }
        this._needsRefinementSet.delete(taskId)
      }
    },

    /**
     * Toggle needs refinement status of a task
     */
    toggle(taskId: number) {
      if (this.needsRefinement(taskId)) {
        this.unmarkNeedsRefinement(taskId)
      } else {
        this.markNeedsRefinement(taskId)
      }
    },

    /**
     * Check if a task needs refinement - O(1) performance
     */
    needsRefinement(taskId: number): boolean {
      return this._needsRefinementSet.has(taskId)
    },

    /**
     * Remove completed tasks from needs refinement set
     */
    removeCompletedTask(taskId: number) {
      this.unmarkNeedsRefinement(taskId)
    }
  },

  persist: {
    key: 'task-needs-refinement',
    // Persist the array, which can be properly serialized
    paths: ['_needsRefinementIds'],
    // Sync Set from array after hydration
    afterRestore: (ctx) => {
      ctx.store._syncSetFromArray()
    }
  }
})
