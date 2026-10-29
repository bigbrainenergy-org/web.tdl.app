import { defineStore } from 'pinia'
import { useTaskStore } from './task-store'
import type { TaskLike } from './task-interfaces-types'

const REFINE_MARKER = '!!REFINE'

/**
 * Add !!REFINE marker to notes if not present
 */
function addRefineMarker(notes: string | undefined): string {
  if (!notes) return REFINE_MARKER
  if (notes.includes(REFINE_MARKER)) return notes
  return `${REFINE_MARKER}\n${notes}`
}

/**
 * Remove !!REFINE marker from notes
 */
function removeRefineMarker(notes: string | undefined): string {
  if (!notes) return ''
  return notes.replace(new RegExp(`${REFINE_MARKER}\\n?`, 'g'), '').trim()
}

export const useTaskNeedsRefinementStore = defineStore('task-needs-refinement', {
  state: () => ({
    // Array for localStorage persistence (fast initial load)
    _needsRefinementIds: [] as number[],
    // Set for O(1) performance (synced from task notes on refresh_all)
    _needsRefinementSet: new Set<number>()
  }),

  getters: {
    // Return the performance Set for external consumers
    ids: (state): Set<number> => state._needsRefinementSet
  },

  actions: {
    /**
     * Initialize Set from localStorage array (called after hydration)
     */
    _syncSetFromArray() {
      this._needsRefinementSet = new Set(this._needsRefinementIds)
    },

    /**
     * Sync from task notes - the DB source of truth (called during refresh_all)
     */
    initializeFromTasks(tasks: TaskLike[]) {
      const refinementIds = tasks.filter(t => t.notes?.includes(REFINE_MARKER)).map(t => t.id)
      this._needsRefinementIds = refinementIds
      this._needsRefinementSet = new Set(refinementIds)
    },

    /**
     * Mark a task as needing refinement and update its notes
     */
    markNeedsRefinement(taskId: number) {
      if (!this._needsRefinementSet.has(taskId)) {
        this._needsRefinementIds.push(taskId)
        this._needsRefinementSet.add(taskId)
        // Update notes in DB (only if marker not already present)
        const task = useTaskStore().mapp.get(taskId)
        if (task) {
          const newNotes = addRefineMarker(task.notes)
          if (newNotes !== task.notes) {
            useTaskStore().apiUpdate(taskId, { notes: newNotes }, { skipRecalculate: true })
          }
        }
      }
    },

    /**
     * Unmark a task as needing refinement and update its notes
     */
    unmarkNeedsRefinement(taskId: number) {
      if (this._needsRefinementSet.has(taskId)) {
        const index = this._needsRefinementIds.indexOf(taskId)
        if (index !== -1) this._needsRefinementIds.splice(index, 1)
        this._needsRefinementSet.delete(taskId)
        // Update notes in DB
        const task = useTaskStore().mapp.get(taskId)
        if (task) {
          const newNotes = removeRefineMarker(task.notes)
          useTaskStore().apiUpdate(taskId, { notes: newNotes }, { skipRecalculate: true })
        }
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
    paths: ['_needsRefinementIds'],
    afterRestore: (ctx) => {
      ctx.store._syncSetFromArray()
    }
  }
})
