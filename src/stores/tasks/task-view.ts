import { ref } from 'vue'
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

export const recalculate = (caller?: string) => {
  if(caller) console.log(`recalculation triggered by ${caller}`)
  else console.trace('recalculate triggered from unspecified caller.')
  // 
  
  tasksLogger.debug('recalculating now.')
  if(currentBaseQueryMode.value === 'allTasks') {
    shadow_state.list = useTaskStore().array
    shadow_state.filtered_list = useTaskStore().array
  }
  else if(currentBaseQueryMode.value === 'layerZero') {
    shadow_state.list = useTaskStore().layerZero.value
  }
  else shadow_state.list = []
  tasksLogger.log(`fetch: ${shadow_state.list.length} tasks.`)
  if(shadow_state.list.length === 0) {
    tasks.value = []
    return
  }
  let beforeLength = shadow_state.list.length
  if(hideCompleted.value) {
    shadow_state.list = shadow_state.list.filter(x => !x.completed)
    shadow_state.filtered_list = shadow_state.filtered_list.filter(x => !x.completed)
  }
  if(currentFilteringMode.value === 'filterByList') {
    if(layerZeroOnly.value && (!searchInput.value || searchInput.value.length === 0)) shadow_state.list = shadow_state.list.filter(x => x.grabPrereqs(true).length === 0)
    shadow_state.list = filterByList(shadow_state.list, selectedList.value)
    shadow_state.filtered_list = filterByList(shadow_state.filtered_list, selectedList.value)
  }
  tasksLogger.log(`filter: ${beforeLength} => ${shadow_state.list.length}`)
  if(shadow_state.list.length === 0) {
    tasks.value = []
    return
  }
  beforeLength = shadow_state.list.length
  if(!searchInput.value || searchInput.value.length === 0) shadow_state.list = sortTasks(shadow_state.list)
  tasksLogger.log(`sort: ${beforeLength} => ${shadow_state.list.length}`)
  tasks.value = shadow_state.list
}