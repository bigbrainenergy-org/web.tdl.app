import { storeToRefs } from 'pinia'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { computed } from 'vue'
import { useTaskFiltering } from './use-task-filtering'
import { useTaskSorting } from './use-task-sorting'
import { useTaskFetching } from './use-task-fetching'

// TODO: unblockedOnly is unused, use it
export function useTasks() {
  const loadingStateStore = useLoadingStateStore()
  const { busy, quickSortDialogActive } = storeToRefs(loadingStateStore)
  const { fetchTasks } = useTaskFetching()
  const { filterTasks } = useTaskFiltering()
  const { sortTasks } = useTaskSorting()

  const tasks = computed(() => {
    if (busy.value) {
      console.debug('busy signal; skipping task recalc.')
      return []
    }
    if (quickSortDialogActive.value) {
      console.debug('quick sort dialog is active; skipping task recalc')
      return []
    }
    console.debug('recalculating tasks')
    let baseQuery = fetchTasks()
    console.debug({ baseQuery })
    baseQuery = filterTasks(baseQuery)
    baseQuery = sortTasks(baseQuery)
    return baseQuery
  })

  return { tasks }
}
