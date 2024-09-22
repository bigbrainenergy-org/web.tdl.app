import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { Task } from 'src/stores/tasks/task-model'
import { filterByAgenda, filterByList } from 'src/utils/task-utils'

export function useTaskFiltering() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentFilteringMode, selectedList } = storeToRefs(localSettingsStore)

  function filterTasks(tasks: Task[]): Task[] {
    if (currentFilteringMode.value === 'filterByList') {
      return filterByList(tasks, selectedList.value)
    } else if (currentFilteringMode.value === 'filterByAgenda') {
      return filterByAgenda(tasks)
    } else {
      return tasks
    }
  }

  return { filterTasks, currentFilteringMode, selectedList }
}
