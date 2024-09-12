import { storeToRefs } from 'pinia'
import { useLayerZeroStore } from 'src/stores/performance/layer-zero'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { computed } from 'vue'
import { useTaskFiltering } from './use-task-filtering'
import { useTaskSorting } from './use-task-sorting'

// TODO: unblockedOnly is unused, use it
export function useTasks() {
  const loadingStateStore = useLoadingStateStore()
  const { busy, quickSortDialogActive } = storeToRefs(loadingStateStore)
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
    let baseQuery = useLayerZeroStore().typed
    console.debug({ baseQuery })
    baseQuery = filterTasks(baseQuery)
    baseQuery = sortTasks(baseQuery)
    return baseQuery
  })

  return { tasks }
}
