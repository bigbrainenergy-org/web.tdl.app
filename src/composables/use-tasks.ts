import { storeToRefs } from 'pinia'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { computed } from 'vue'
import { useTaskFiltering } from './use-task-filtering'
import { useTaskSorting } from './use-task-sorting'
import { useTaskFetching } from './use-task-fetching'
import type { Task } from 'src/stores/tasks/task-model'

// TODO: unblockedOnly is unused, use it
export function useTasks() {
  const loadingStateStore = useLoadingStateStore()
  const { busy, quickSortDialogActive } = storeToRefs(loadingStateStore)
  const { fetchTasks } = useTaskFetching()
  const { filterTasks } = useTaskFiltering()
  const { sortTasks } = useTaskSorting()

  const tasks = computed((): Task[] => {
    if (busy.value) {
      console.debug('busy signal; skipping task recalc.')
      return []
    }
    if (quickSortDialogActive.value) {
      console.debug('quick sort dialog is active; skipping task recalc')
      return []
    }
    console.debug('recalculating tasks')
    let baseQuery: Task[] = []
    try { 
      baseQuery = fetchTasks()
      console.log('baseQuery done')
    } catch(baseQueryEx) {
      console.warn({ msg: 'base query exception', baseQueryEx })
      baseQuery = []
    }
    try {
      baseQuery = filterTasks(baseQuery)
      console.log('filterTasks done')
      console.debug({ filterTasks: baseQuery })
    } catch(filterTasksEx) {
      console.warn({ msg: 'filter tasks exception', filterTasksEx })
      baseQuery = []
    }
    try {
      baseQuery = sortTasks(baseQuery)
      console.log('sortTasks done')
      console.debug({ sortTasks: baseQuery })
    } catch(sortTasksEx) {
      console.warn({ msg: 'sort tasks exception', sortTasksEx })
      baseQuery = []
    }
    console.debug('yay')
    return baseQuery
  })

  return { tasks }
}
