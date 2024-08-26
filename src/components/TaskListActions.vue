<template>
  <SettingsButton v-model:settings="tasksPageSettings" />
  <q-space />
  <q-item-label class="text-primary">{{ tasks.length }} tasks</q-item-label>
  <q-space />
  <q-btn icon="fa-solid fa-signs-post" class="text-primary" @click="openQuickSortDialog" />
  <q-btn icon="fa-solid fa-search" class="text-primary" @click="openSearchDialog" />
</template>

<script setup lang="ts">
  import { useQuasar, useMeta } from 'quasar'
  import { computed, defineComponent, ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useRepo } from 'pinia-orm'
  import { Task, TaskRepo } from 'src/stores/tasks/task'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { Utils } from 'src/util'
  import { TDLAPP } from 'src/TDLAPP'
  import QuickSortLayerZeroDialog from 'src/components/dialogs/QuickSortLayerZeroDialog.vue'
  import SettingsButton from 'src/components/SettingsButton.vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import TaskList from 'src/components/TaskList.vue'
  import { cachedTask, useAllTasksStore } from 'src/stores/performance/all-tasks'
  import { useLayerZeroStore } from 'src/stores/performance/layer-zero'
  import TaskPage from 'src/components/TaskPage.vue'

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
