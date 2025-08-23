import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useTasks } from './use-tasks'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { useTaskStore } from 'src/stores/tasks/task-store'
import { Logger } from 'src/utils/d'

const PostreqWarningLogger = new Logger('Postreq Warning Composable')

export function usePostreqWarning() {
  const localSettingsStore = useLocalSettingsStore()
  const { disableQuickSort, enableQuickSortOnLayerZeroQTY, autoScalePriority } =
    storeToRefs(localSettingsStore)

  // const notCompleted = (x: Task) => x.completed === false

  PostreqWarningLogger.debug('hello from usePostreqWarning')

  const { tasks } = useTasks()

  const autoThreshold = computed(() => {
    PostreqWarningLogger.log('meep autothreshold')
    const sampleSize = Math.min(tasks.value.length, 10)
    let sumPriorities = 0
    for (let i = 0; i < sampleSize; i++) {
      sumPriorities += tasks.value[i]!.grabPostreqs(false).filter((x) => !x.completed).length
    }
    return Math.floor(sumPriorities / sampleSize)
  })

  const postreqQuantityWarningThreshold = computed(() => {
    PostreqWarningLogger.log('meep postreq quantity warning')
    const len0 = useTaskStore().layerZero.value.length
    if (disableQuickSort.value) return len0
    return autoScalePriority.value
      ? autoThreshold.value
      : Math.max(1, enableQuickSortOnLayerZeroQTY.value - len0)
  })

  return { postreqQuantityWarningThreshold }
}
