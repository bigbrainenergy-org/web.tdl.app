import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useTasks } from './use-tasks'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { useTaskStore } from 'src/stores/tasks/task-store'

export function usePostreqWarning() {
  const localSettingsStore = useLocalSettingsStore()
  const { disableQuickSort, enableQuickSortOnLayerZeroQTY, autoScalePriority } =
    storeToRefs(localSettingsStore)

  // const notCompleted = (x: Task) => x.completed === false

  const { tasks } = useTasks()

  const autoThreshold = computed(() => {
    const sampleSize = Math.min(tasks.value.length, 10)
    let sumPriorities = 0
    for (let i = 0; i < sampleSize; i++) {
      sumPriorities += tasks.value[i].hard_postreqs.filter((x) => !x.completed).length
    }
    return Math.floor(sumPriorities / sampleSize)
  })

  const postreqQuantityWarningThreshold = computed(() => {
    const len0 = useTaskStore().layerZero.length
    if (disableQuickSort.value) return len0
    return autoScalePriority.value
      ? autoThreshold.value
      : Math.max(1, enableQuickSortOnLayerZeroQTY.value - len0)
  })

  return { postreqQuantityWarningThreshold }
}
