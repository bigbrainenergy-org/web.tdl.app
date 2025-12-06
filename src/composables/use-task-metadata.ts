import { computed, type ComputedRef, type Ref } from 'vue'
import type { Task } from 'src/stores/tasks/task-model'
import { useTaskStore } from 'src/stores/tasks/task-store'
import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
import { useTaskNeedsRefinementStore } from 'src/stores/tasks/task-needs-refinement'

/**
 * Metadata shape that can be spread directly onto TaskItem via v-bind.
 * Example: <TaskItem v-bind="metadata" />
 */
export interface TaskMetadata {
  task: Task
  isLayerZero: boolean
  isStarred: boolean
  hasStarredDescendants: boolean
  needsRefinement: boolean
}

/**
 * Composable for computing task metadata efficiently.
 * Centralizes layer zero checks, starred status, and refinement status
 * to avoid repeated store lookups in child components.
 */
export function useTaskMetadata() {
  const taskStore = useTaskStore()
  const starredStore = useTaskStarredStore()
  const refinementStore = useTaskNeedsRefinementStore()

  // Compute layer zero IDs once as a Set for O(1) lookups
  const layerZeroIds: ComputedRef<Set<number>> = computed(() => {
    return new Set(taskStore.layerZero.value.map(t => t.id))
  })

  const isLayerZero = (taskId: number): boolean => {
    return layerZeroIds.value.has(taskId)
  }

  /**
   * Compute metadata for a list of tasks in a single pass.
   * More efficient than computing per-item in child components.
   * Returns a computed that can be used directly with v-for + v-bind.
   */
  const computeMetadataForTasks = (tasks: Ref<Task[]> | ComputedRef<Task[]>): ComputedRef<TaskMetadata[]> => {
    return computed(() => {
      const l0Set = layerZeroIds.value
      const starredSet = starredStore._starredSet

      return tasks.value.map(task => ({
        task,
        isLayerZero: l0Set.has(task.id),
        isStarred: starredSet.has(task.id),
        hasStarredDescendants: starredStore.getStarredDescendantCount(task.id) > 0,
        needsRefinement: refinementStore.needsRefinement(task.id)
      }))
    })
  }

  /**
   * Get metadata for a single task (useful when not iterating)
   */
  const getTaskMetadata = (task: Task): TaskMetadata => {
    return {
      task,
      isLayerZero: layerZeroIds.value.has(task.id),
      isStarred: starredStore.isStarred(task.id),
      hasStarredDescendants: starredStore.getStarredDescendantCount(task.id) > 0,
      needsRefinement: refinementStore.needsRefinement(task.id)
    }
  }

  return {
    layerZeroIds,
    isLayerZero,
    computeMetadataForTasks,
    getTaskMetadata
  }
}
