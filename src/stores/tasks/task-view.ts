import { ref, watch } from 'vue'
import { type Task } from './task-model'
import { storeToRefs } from 'pinia'
import { Logger } from 'src/utils/d'
import { useLocalSettingsStore } from '../local-settings/local-setting'
import { useTaskStore } from './task-store'
import { searchInput } from './task-utils'
import { filterByList } from 'src/utils/task-utils'
import { useTaskSorting } from 'src/composables/use-task-sorting'

const tasksLogger = new Logger('task view', '#61A5FB')
tasksLogger.log('task-view.ts module loading')

export const tasks = ref<Task[]>([])
export const filtered_tasks = ref<Task[]>([])

// Track recalculate requests to ignore stale results
let recalculateRequestId = 0

tasksLogger.log('getting store refs...')
const { currentBaseQueryMode, currentFilteringMode, selectedList, hideCompleted, layerZeroOnly, currentSortingMode } = storeToRefs(useLocalSettingsStore())
tasksLogger.log('getting sortTasks composable...')
const { sortTasks } = useTaskSorting()
tasksLogger.log('task-view.ts module loaded')

watch(searchInput, (v: string | undefined) => {
  if(v && v.length > 0) { return }
  console.log('recalculate')
  recalculate('searchInput')
})

/**
 * Recalculate task list - main thread sorting with stale-result handling
 */
export const recalculate = (caller?: string) => {
  if(caller) tasksLogger.log(`recalculation triggered by ${caller}`)
  else console.trace('recalculate triggered from unspecified caller.')

  // Track this request to ignore stale results
  const thisRequestId = ++recalculateRequestId

  const timings: Record<string, number> = {
    total: performance.now(),
    fetch: 0,
    filter: 0,
    sort: 0,
    assignment: 0
  }

  tasksLogger.debug('recalculating now.')

  // Fetch tasks
  // For agenda sorting, we only need INCOMPLETE tasks - completed tasks don't affect sort order
  timings.fetch = performance.now()
  let taskList: Task[]
  if (currentSortingMode.value === 'sortByAgenda') {
    // Agenda sort only needs incomplete tasks to traverse the dependency graph
    taskList = useTaskStore().incompleteOnly.value
  } else if(currentBaseQueryMode.value === 'allTasks') {
    taskList = useTaskStore().array
  } else if(currentBaseQueryMode.value === 'layerZero') {
    taskList = useTaskStore().layerZero.value
  } else {
    taskList = []
  }
  timings.fetch = performance.now() - timings.fetch

  tasksLogger.log(`fetch: ${taskList.length} tasks.`)
  if(taskList.length === 0) {
    tasks.value = []
    return
  }

  // Quick filter on main thread
  timings.filter = performance.now()
  if(hideCompleted.value) {
    taskList = taskList.filter(x => !x.completed)
  }
  // For agenda sorting, skip layerZeroOnly filtering - the sort naturally orders by layer
  if(currentFilteringMode.value === 'filterByList') {
    if(currentSortingMode.value !== 'sortByAgenda' && layerZeroOnly.value && (!searchInput.value || searchInput.value.length === 0)) {
      taskList = taskList.filter(x => x.grabPrereqs(true).length === 0)
    }
    taskList = filterByList(taskList, selectedList.value)
  }
  timings.filter = performance.now() - timings.filter

  if(taskList.length === 0) {
    tasks.value = []
    return
  }

  // Skip sorting if search is active
  if(searchInput.value && searchInput.value.length > 0) {
    tasksLogger.log('skipping sort because search input is not empty.')
    tasks.value = taskList
    return
  }

  // Sort on main thread (fast) - defer reactive update to avoid blocking
  tasksLogger.log(`Sorting ${taskList.length} tasks, sortingMode=${currentSortingMode.value}, requestId=${thisRequestId}`)

  timings.sort = performance.now()
  const sortedTasks = sortTasks(taskList)
  timings.sort = performance.now() - timings.sort

  // Check if this request is still the latest before updating
  if (thisRequestId !== recalculateRequestId) {
    tasksLogger.log(`Ignoring stale sort result (request ${thisRequestId}, latest is ${recalculateRequestId})`)
    return
  }

  // Assign to reactive ref
  timings.assignment = performance.now()
  tasks.value = sortedTasks
  timings.assignment = performance.now() - timings.assignment

  timings.total = performance.now() - timings.total!
  tasksLogger.log(`RECALCULATE TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)
}