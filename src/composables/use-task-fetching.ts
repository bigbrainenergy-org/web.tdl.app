import { useTaskStore } from 'src/stores/tasks/task-store'

export function useTaskFetching() {
  // TODO: Allow switching between all tasks, and layer zero (aka next up) tasks
  function fetchTasks() {
    return useTaskStore().layerZero
  }

  return { fetchTasks }
}
