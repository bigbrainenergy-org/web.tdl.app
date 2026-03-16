import { computed, type ComputedRef, type Ref } from 'vue'
import type { Task } from 'src/stores/tasks/task-model'
import { useTaskStore } from 'src/stores/tasks/task-store'
import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
import { useTaskNeedsRefinementStore } from 'src/stores/tasks/task-needs-refinement'
import { useNow } from './useNow'
import { computeInheritedDeadline, formatDeadlineText, type InheritedDeadlineResult } from 'src/utils/inherited-deadline'

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
  isProject: boolean
  isOverdue: boolean
  isReminderTriggered: boolean
  taskBackgroundStyle: string | undefined
  inheritedDeadline?: InheritedDeadlineResult
  deadlineText?: string
  isInheritedOverdue: boolean
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
  const now = useNow()

  // Compute layer zero IDs once as a Set for O(1) lookups
  const layerZeroIds: ComputedRef<Set<number>> = computed(() => {
    return new Set(taskStore.layerZero.value.map((t) => t.id))
  })

  const isLayerZero = (taskId: number): boolean => {
    return layerZeroIds.value.has(taskId)
  }

  /**
   * Compute metadata for a list of tasks in a single pass.
   * More efficient than computing per-item in child components.
   * Returns a computed that can be used directly with v-for + v-bind.
   */
  const computeMetadataForTasks = (
    tasks: Ref<Task[]> | ComputedRef<Task[]>
  ): ComputedRef<TaskMetadata[]> => {
    return computed(() => {
      void taskStore.arrayVersion // subscribe to in-place task mutations (shallowRef doesn't track deep changes)
      const l0Set = layerZeroIds.value
      const starredSet = starredStore._starredSet
      const currentTime = now.value

      // Shared memo for inherited deadline computation across all tasks
      const deadlineMemo = new Map<number, InheritedDeadlineResult | null>()
      const deadlineVisited = new Set<number>()

      return tasks.value.map((task) => {
        const isProject = task.notes?.includes('!PROJECT') ?? false
        const isOverdue =
          !task.completed && !!task.deadline_at && new Date(task.deadline_at) < currentTime
        const isReminderTriggered =
          !task.completed && !!task.remind_me_at && new Date(task.remind_me_at) < currentTime
        const taskBackgroundStyle = isOverdue
          ? 'background-color: #5a0000'
          : isReminderTriggered
            ? 'background-color: #cc6600'
            : undefined

        const inherited = task.completed ? null : computeInheritedDeadline(task, deadlineMemo, deadlineVisited)
        const isInheritedOverdue = !task.completed && !task.deadline_at &&
          !!inherited && inherited.deadline < currentTime

        return {
          task,
          isLayerZero: l0Set.has(task.id),
          isStarred: starredSet.has(task.id),
          hasStarredDescendants: starredStore.getStarredDescendantCount(task.id) > 0,
          needsRefinement: refinementStore.needsRefinement(task.id),
          isProject,
          isOverdue,
          isReminderTriggered,
          taskBackgroundStyle,
          inheritedDeadline: inherited ?? undefined,
          deadlineText: inherited ? formatDeadlineText(inherited.deadline, currentTime) : undefined,
          isInheritedOverdue
        }
      })
    })
  }

  /**
   * Get metadata for a single task (useful when not iterating)
   */
  const getTaskMetadata = (task: Task): TaskMetadata => {
    const currentTime = now.value
    const isProject = task.notes?.includes('!PROJECT') ?? false
    const isOverdue =
      !task.completed && !!task.deadline_at && new Date(task.deadline_at) < currentTime
    const isReminderTriggered =
      !task.completed && !!task.remind_me_at && new Date(task.remind_me_at) < currentTime
    const taskBackgroundStyle = isOverdue
      ? 'background-color: #5a0000'
      : isReminderTriggered
        ? 'background-color: #cc6600'
        : undefined

    const deadlineMemo = new Map<number, InheritedDeadlineResult | null>()
    const deadlineVisited = new Set<number>()
    const inherited = task.completed ? null : computeInheritedDeadline(task, deadlineMemo, deadlineVisited)
    const isInheritedOverdue = !task.completed && !task.deadline_at &&
      !!inherited && inherited.deadline < currentTime

    return {
      task,
      isLayerZero: layerZeroIds.value.has(task.id),
      isStarred: starredStore.isStarred(task.id),
      hasStarredDescendants: starredStore.getStarredDescendantCount(task.id) > 0,
      needsRefinement: refinementStore.needsRefinement(task.id),
      isProject,
      isOverdue,
      isReminderTriggered,
      taskBackgroundStyle,
      inheritedDeadline: inherited ?? undefined,
      deadlineText: inherited ? formatDeadlineText(inherited.deadline, currentTime) : undefined,
      isInheritedOverdue
    }
  }

  return {
    layerZeroIds,
    isLayerZero,
    computeMetadataForTasks,
    getTaskMetadata
  }
}
