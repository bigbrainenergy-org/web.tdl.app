import { storeToRefs } from 'pinia'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { computed } from 'vue'
import { useTaskFiltering } from './use-task-filtering'
import { useTaskSorting } from './use-task-sorting'
import { useTaskFetching } from './use-task-fetching'
import type { Task } from 'src/stores/tasks/task-model'
import { Logger } from 'src/utils/d'
import { searchInput } from 'src/stores/tasks/task-utils'

const useTasksLogger = new Logger('Use-Tasks Composable', '#61A5FB')

// TODO: unblockedOnly is unused, use it
export function useTasks() {
  const loadingStateStore = useLoadingStateStore()
  const { busy, quickSortDialogActive } = storeToRefs(loadingStateStore)
  const { fetchTasks } = useTaskFetching()
  const { filterTasks } = useTaskFiltering()
  const { sortTasks } = useTaskSorting()

  const tasks = computed((): Task[] => {
    if (busy.value) {
      useTasksLogger.debug('busy signal; skipping task recalc.')
      return []
    }
    if (quickSortDialogActive.value) {
      useTasksLogger.debug('quick sort dialog is active; skipping task recalc')
      return []
    }
    useTasksLogger.debug('recalculating tasks')
    // const timings: any = {
    //   baseQuery: performance.now()
    // }
    let baseQuery: Task[] = []
    try { 
      //timings.fetchTasks = performance.now()
      baseQuery = fetchTasks()
      //timings.fetchTasks = performance.now() - timings.fetchTasks
      useTasksLogger.log(`fetch: ${baseQuery.length} tasks`)
    } catch(baseQueryEx) {
      useTasksLogger.warn({ msg: 'base query exception', baseQueryEx })
      baseQuery = []
    }
    try {
      //timings.filterTasks = performance.now()
      const beforeLength = baseQuery.length
      baseQuery = filterTasks(baseQuery)
      //timings.filterTasks = performance.now() - timings.filterTasks
      //useTasksLogger.debug({ filterTasks: baseQuery })
      useTasksLogger.log(`filter: ${beforeLength} => ${baseQuery.length}`)
    } catch(filterTasksEx) {
      useTasksLogger.warn({ msg: 'filter tasks exception', filterTasksEx })
      baseQuery = []
    }
    try {
      const beforeLength = baseQuery.length
      //timings.sortTasks = performance.now()
      if(!searchInput.value || searchInput.value.length === 0) baseQuery = sortTasks(baseQuery)
      //timings.sortTasks = performance.now() - timings.sortTasks
      //useTasksLogger.debug({ sortTasks: baseQuery })
      useTasksLogger.log(`sort: ${beforeLength} => ${baseQuery.length}`)
    } catch(sortTasksEx) {
      useTasksLogger.warn({ msg: 'sort tasks exception', sortTasksEx })
      baseQuery = []
    }
    //timings.baseQuery = performance.now() - timings.baseQuery
    //useTasksLogger.log(`TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)
    return baseQuery
  })

  return { tasks }
}
