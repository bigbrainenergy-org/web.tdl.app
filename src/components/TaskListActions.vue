<template>
  <SettingsButton v-model:settings="tasksPageSettings" />
  <q-space />
  <q-item-label class="text-primary">{{ tasks.length }} tasks</q-item-label>
  <q-space />
  <q-btn icon="fa-solid fa-signs-post" class="text-primary" @click="openQuickSortDialog" />
  <q-btn icon="fa-solid fa-search" class="text-primary" @click="openSearchDialog(() => { })" />
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { Task } from 'src/stores/tasks/task'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import SettingsButton from 'src/components/SettingsButton.vue'
  // import { TDLAPP } from 'src/TDLAPP'
  import { openQuickSortDialog, openSearchDialog } from 'src/utils/dialog-utils'
  // import { openQuickSortDialog } from 'src/utils/dialog-utils'
  // const openSearchDialog = () => TDLAPP.searchDialog()

  const tasks = defineModel<Array<Task>>('tasks', { required: true })

  const localSettingsStore = useLocalSettingsStore()

  const {
    layerZeroOnly,
    hideCompleted,
    autoScalePriority
  } = storeToRefs(localSettingsStore)

  const tasksPageSettings = ref({
    'Unblocked Only': layerZeroOnly,
    'Incomplete Only': hideCompleted,
    'Auto Scale Priority': autoScalePriority
  })
</script>
