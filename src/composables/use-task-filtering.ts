import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { cachedTask } from 'src/stores/performance/all-tasks'
import { filterByList } from 'src/utils/task-utils'

export function useTaskFiltering() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentFilteringMode, selectedList } = storeToRefs(localSettingsStore)

  function filterTasks(tasks: cachedTask[]): cachedTask[] {
    if(currentFilteringMode.value === 'filterByList') {
      return filterByList(tasks, selectedList.value)
    } else if(currentFilteringMode.value === 'filterByAgenda') {
      return []
    } else {
      return tasks
    }
  }

  return { filterTasks, currentFilteringMode, selectedList }
}
