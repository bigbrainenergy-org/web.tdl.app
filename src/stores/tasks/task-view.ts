import { ref, watch } from 'vue'
import { type Task } from './task-model'
import { storeToRefs } from 'pinia'
import { useLoadingStateStore } from '../performance/loading-state'
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

tasksLogger.log('getting store refs...')
const { busy, quickSortDialogActive } = storeToRefs(useLoadingStateStore())
const { currentBaseQueryMode, currentFilteringMode, selectedList, hideCompleted, layerZeroOnly } = storeToRefs(useLocalSettingsStore())
tasksLogger.log('getting sortTasks composable...')
const { sortTasks } = useTaskSorting()
tasksLogger.log('task-view.ts module loaded')

const shadow_state: {
  list: Task[]
  filtered_list: Task[]
} = {
  list: [],
  filtered_list: []
}

watch(searchInput, (v: string | undefined) => {
  if(v && v.length > 0) { return }
  console.log('recalculate')
  recalculate('searchInput')
})

export const recalculate = (caller?: string) => {
  if(caller) console.log(`recalculation triggered by ${caller}`)
  else console.trace('recalculate triggered from unspecified caller.')

  const timings: any = {
    total: performance.now(),
    fetch: 0,
    filterCompleted: 0,
    filterByList: 0,
    sort: 0,
    assignment: 0
  }

  tasksLogger.debug('recalculating now.')
  timings.fetch = performance.now()
  if(currentBaseQueryMode.value === 'allTasks') {
    shadow_state.list = useTaskStore().array
    shadow_state.filtered_list = useTaskStore().array
  }
  else if(currentBaseQueryMode.value === 'layerZero') {
    shadow_state.list = useTaskStore().layerZero.value
  }
  else shadow_state.list = []
  timings.fetch = performance.now() - timings.fetch
  tasksLogger.log(`fetch: ${shadow_state.list.length} tasks.`)
  if(shadow_state.list.length === 0) {
    tasks.value = []
    return
  }
  let beforeLength = shadow_state.list.length
  timings.filterCompleted = performance.now()
  if(hideCompleted.value) {
    shadow_state.list = shadow_state.list.filter(x => !x.completed)
    shadow_state.filtered_list = shadow_state.filtered_list.filter(x => !x.completed)
  }
  timings.filterCompleted = performance.now() - timings.filterCompleted
  timings.filterByList = performance.now()
  if(currentFilteringMode.value === 'filterByList') {
    if(layerZeroOnly.value && (!searchInput.value || searchInput.value.length === 0)) shadow_state.list = shadow_state.list.filter(x => x.grabPrereqs(true).length === 0)
    shadow_state.list = filterByList(shadow_state.list, selectedList.value)
    shadow_state.filtered_list = filterByList(shadow_state.filtered_list, selectedList.value)
  }
  timings.filterByList = performance.now() - timings.filterByList
  tasksLogger.log(`filter: ${beforeLength} => ${shadow_state.list.length}`)
  if(shadow_state.list.length === 0) {
    tasks.value = []
    return
  }
  beforeLength = shadow_state.list.length
  timings.sort = performance.now()
  if(!searchInput.value || searchInput.value.length === 0) shadow_state.list = sortTasks(shadow_state.list)
  else console.log('skipping sort because search input is not empty.')
  timings.sort = performance.now() - timings.sort
  tasksLogger.log(`sort: ${beforeLength} => ${shadow_state.list.length}`)
  timings.assignment = performance.now()
  tasks.value = shadow_state.list
  timings.assignment = performance.now() - timings.assignment
  timings.total = performance.now() - timings.total
  tasksLogger.log(`RECALCULATE TIMINGS: ${JSON.stringify(timings, undefined, '\n')}`)
}