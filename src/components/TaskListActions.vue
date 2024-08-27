<template>
  <SettingsButton v-model:settings="tasksPageSettings" />
  <q-space />
  <q-item-label class="text-primary">{{ tasks.length }} tasks</q-item-label>
  <q-space />
  <q-btn icon="fa-solid fa-signs-post" class="text-primary" @click="openQuickSortDialog" />
  <q-btn icon="fa-solid fa-search" class="text-primary" @click="openSearchDialog" />
</template>

<script setup lang="ts">
  import { useQuasar } from 'quasar'
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
  import { openQuickSortDialog, openSearchDialog } from 'src/utils/dialog-utils'

  const tasks = defineModel<Array<Task>>('tasks')

  const localSettingsStore = useLocalSettingsStore()

  const {
    layerZeroOnly,
    hideCompleted,
    disableQuickSort,
    enableQuickSortOnLayerZeroQTY,
    autoScalePriority
  } = storeToRefs(localSettingsStore)

  const tasksPageSettings = ref({
    'Unblocked Only': layerZeroOnly,
    'Incomplete Only': hideCompleted,
    'Auto Scale Priority': autoScalePriority
  })
</script>
