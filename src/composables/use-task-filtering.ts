import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import type { Task } from 'src/stores/tasks/task-model'
import { searchInput } from 'src/stores/tasks/task-utils'
import { filterByAgenda, filterByList } from 'src/utils/task-utils'

export function useTaskFiltering() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentFilteringMode, selectedList, hideCompleted, layerZeroOnly } = storeToRefs(localSettingsStore)

  // todo: perhaps add Fuse here
  function filterTasks(tasks: Task[]): Task[] {
    console.log({ filterMode: currentFilteringMode.value })
    if(hideCompleted.value) tasks = tasks.filter(x => !x.completed)
    // todo: must respond to incompleteOnly and possibly other local settings too.
    if (currentFilteringMode.value === 'filterByList') {
      if(layerZeroOnly.value && (!searchInput.value || searchInput.value.length === 0)) tasks = tasks.filter(x => x.grabPrereqs(true).length === 0)
      return filterByList(tasks, selectedList.value)
    } else if (currentFilteringMode.value === 'filterByAgenda') {
      return filterByAgenda(tasks)
    } else {
      return tasks
    }
  }

  return { filterTasks, currentFilteringMode, selectedList }
}
