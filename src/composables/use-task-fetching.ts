import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import type { Task } from 'src/stores/tasks/task-model'
import { useTaskStore } from 'src/stores/tasks/task-store'

export function useTaskFetching() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentBaseQueryMode } = storeToRefs(localSettingsStore)

  function fetchTasks() {
    if (currentBaseQueryMode.value === 'allTasks' ) {
      return useTaskStore().array
    } else if(currentBaseQueryMode.value === 'layerZero') {
      return useTaskStore().layerZero.value
    } else {
      return []
    }
  }

  return { fetchTasks }
}
