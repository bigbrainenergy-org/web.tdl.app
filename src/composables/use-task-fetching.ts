import { useLayerZeroStore } from 'src/stores/performance/layer-zero'

export function useTaskFetching() {
  // TODO: Allow switching between all tasks, and layer zero (aka next up) tasks
  function fetchTasks() {
    return useLayerZeroStore().typed
  }

  return { fetchTasks }
}
