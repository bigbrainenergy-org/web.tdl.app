import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { useTaskStore } from 'src/stores/tasks/task-store'

export function useTaskFetching() {
  const localSettingsStore = useLocalSettingsStore()
  const { currentBaseQueryMode } = storeToRefs(localSettingsStore)

  function fetchTasks() {
    if (currentBaseQueryMode.value === 'allTasks' ) {
      return useTaskStore().allTasks
    } else if(currentBaseQueryMode.value === 'layerZero') {
      return useTaskStore().layerZero
    } else {
      return []
    }
  }

  return { fetchTasks }
}
