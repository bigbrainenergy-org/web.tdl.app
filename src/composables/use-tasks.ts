import { storeToRefs } from 'pinia'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { cachedTask } from 'src/stores/performance/all-tasks'
import { useLayerZeroStore } from 'src/stores/performance/layer-zero'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { computed } from 'vue'

// TODO: unblockedOnly is unused, use it
export function useTasks() {
  const loadingStateStore = useLoadingStateStore()
  const { busy } = storeToRefs(loadingStateStore)
  const localSettingsStore = useLocalSettingsStore()
  const { hideCompleted, selectedList } = storeToRefs(localSettingsStore)
  const anotherthing = ''

  const tasks = computed(() => {
    if (busy.value) return []
    console.debug('updating tasks on Task page')
    let baseQuery = useLayerZeroStore().typed
    console.debug({ baseQuery })
    const filterByList = (x: cachedTask) => x.t.list?.title === selectedList.value
    if (selectedList.value) baseQuery = baseQuery.filter(filterByList)
    const postreqs = hideCompleted.value
      ? (t: cachedTask) => t.hard_postreqs.filter((x) => !x.completed)
      : (t: cachedTask) => t.hard_postreqs
    baseQuery.sort((a, b) => postreqs(b).length - postreqs(a).length)
    return baseQuery
  })

  return { tasks }
}
