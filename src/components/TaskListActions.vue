<template>
  <SettingsButton v-model:settings="tasksPageSettings" />
  <q-btn text-color="primary" icon="sort" @click="toggleAgenda" />
  <q-space />
  <q-item-label class="text-primary">{{ tasks.length }} tasks</q-item-label>
  <q-space />
  <q-btn icon="fa-solid fa-signs-post" class="text-primary" @click="openQuickSortDialog" />
  <q-btn icon="fa-solid fa-search" class="text-primary" @click="openBespokeSearchDialog()" />
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import SettingsButton from 'src/components/SettingsButton.vue'
  import { openQuickSortDialog, openBespokeSearchDialog } from 'src/utils/dialog-utils'
  import { Task } from 'src/stores/tasks/task-model'
  
  const tasks = defineModel<Array<Task>>('tasks', { required: true })

  const localSettingsStore = useLocalSettingsStore()

  const { layerZeroOnly, hideCompleted, autoScalePriority, currentSortingMode } = storeToRefs(localSettingsStore)

  const tasksPageSettings = ref({
    'Unblocked Only': layerZeroOnly,
    'Incomplete Only': hideCompleted,
    'Auto Scale Priority': autoScalePriority
  })

  const toggleAgenda = () => {
    if(currentSortingMode.value === 'sortByAgenda') currentSortingMode.value = 'sortByPostreqs'
    else currentSortingMode.value = 'sortByAgenda'
  }
</script>
