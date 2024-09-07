import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { cachedTask } from 'src/stores/performance/all-tasks'
import { sortByPostreqs } from 'src/utils/task-utils'

export function useTaskSorting() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentSortingMode, hideCompleted } = storeToRefs(localSettingsStore)

  function sortTasks(tasks: cachedTask[]): cachedTask[] {
    if(currentSortingMode.value === 'sortByPostreqs') {
      return sortByPostreqs(tasks, hideCompleted.value)
    } else {
      return tasks
    }
  }

  return { sortTasks }
}
