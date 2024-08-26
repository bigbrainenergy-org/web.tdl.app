<template>
  <SettingsButton v-model:settings="tasksPageSettings" />
  <q-space />
  <q-item-label class="text-primary">{{ tasks.length }} tasks</q-item-label>
  <q-space />
  <q-btn icon="fa-solid fa-signs-post" class="text-primary" @click="openQuickSortDialog" />
  <q-btn icon="fa-solid fa-search" class="text-primary" @click="openSearchDialog" />
</template>

<script setup lang="ts">
  const openQuickSortDialog = () => {
    if (useLoadingStateStore().quickSortDialogActive) return
    // todo fixme this is BAD.
    useLoadingStateStore().quickSortDialogActive = true
    console.log('OPENING QUICK SORT')
    Dialog.create({
      component: QuickSortLayerZeroDialog,
      componentProps: {
        objective: useLocalSettingsStore().enableQuickSortOnLayerZeroQTY
      }
    })
  }

  const { tasks } = storeToRefs(useLayerZeroStore())
  // todo: storeToRefs
  const hasTooManyInLayerZero = () =>
    useLocalSettingsStore().enableQuickSortOnLayerZeroQTY > 0
      ? tasks.value.length > useLocalSettingsStore().enableQuickSortOnLayerZeroQTY
      : false
  // const postreqs = (x: Task, incompleteOnly = true) => incompleteOnly ? x.hard_postreqs.filter(x => !x.completed) : x.hard_postreqs
  const hasNewTasksInLayerZero = () =>
    useLocalSettingsStore().enableQuickSortOnNewTask
      ? tasks.value.filter(
          (x: cachedTask) => x.hard_postreqs.filter((y) => !y.completed).length === 0
        ).length > 0
      : false
  const quickSortEnabled = () =>
    !useLocalSettingsStore().disableQuickSort &&
    $route.path !== '/settings' &&
    !useLoadingStateStore().dialogOpenExclQuickSort
  const shouldSort = computed<{ l0len: number; shouldSort: boolean }>({
    get: () => ({
      l0len: tasks.value.length,
      shouldSort: quickSortEnabled() && (hasTooManyInLayerZero() || hasNewTasksInLayerZero())
    }),
    set: (x) => {
      if (!x.shouldSort && !(hasTooManyInLayerZero() || hasNewTasksInLayerZero())) return x
    }
  })

  watch(shouldSort, () => {
    // console.log(`layer zero length is ${tasks.value.length}`)
    if (shouldSort.value.shouldSort) {
      openQuickSortDialog()
    }
  })
</script>
