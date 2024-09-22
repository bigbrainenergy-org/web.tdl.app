import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { Task } from 'src/stores/tasks/task-model'
import { sortByPostreqs } from 'src/utils/task-utils'

export function useTaskSorting() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentSortingMode, hideCompleted } = storeToRefs(localSettingsStore)

  function sortTasks(tasks: Task[]): Task[] {
    if (currentSortingMode.value === 'sortByPostreqs') {
      return sortByPostreqs(tasks, hideCompleted.value)
    } else if(currentSortingMode.value === 'sortByAgenda') {
      return tasks
    } else {
      return tasks
    }
  }

  return { sortTasks }
}
