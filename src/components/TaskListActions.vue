<template>
  <GloriousSettingsPopup>
    <GloriousToggle v-model:model-value="layerZeroOnly" label="Unblocked Tasks Only" />
    <GloriousToggle v-model:model-value="hideCompleted" label="Incomplete Tasks Only" />
    <GloriousToggle v-model:model-value="autoScalePriority" label="Auto Scale Priority" />
  </GloriousSettingsPopup>
  <q-btn text-color="primary" icon="sort" @click="toggleAgenda" />
  <q-btn v-if="agendaOnFire" text-color="red" icon="fa-solid fa-dumpster-fire" @click="openLargestOfFirstTenTasks" />
  <q-space />
  <q-item-label class="text-primary">{{ tasks.length }} tasks</q-item-label>
  <q-space />
  <q-btn icon="fa-solid fa-signs-post" class="text-primary" @click="openQuickSortDialog" />
  <q-btn icon="fa-solid fa-search" class="text-primary" @click="openBespokeSearchDialog()" />
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { openQuickSortDialog, openBespokeSearchDialog, openUpdateTaskDialog } from 'src/utils/dialog-utils'
  import type { Task } from 'src/stores/tasks/task-model'
  import GloriousToggle from './glorious/GloriousToggle.vue'
  import GloriousSettingsPopup from './glorious/GloriousSettingsPopup.vue'
  import { notifySuccess } from 'src/utils/notification-utils'
  
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

  const agendaOnFire = computed(() => {
    let countFire = 0
    const fireAmt = localSettingsStore.strictModeMaxPostreqs
    tasks.value.slice(0, 9).forEach(x => {
      if(x.incomplete_postreqs.length > fireAmt) countFire++
    })
    return countFire > 2
  })

  const openLargestOfFirstTenTasks = () => {
    if(tasks.value.length === 0) notifySuccess('Nothing to do here!')
    if(tasks.value.length === 1) openUpdateTaskDialog(tasks.value[0]!)
    else {
      notifySuccess('Sort The Postreqs of this Task.')
      let largest = tasks.value[0]!
      for(let i = 1; i < Math.min(9, tasks.value.length); i++) {
        if(tasks.value[i]!.incomplete_postreqs.length > largest.incomplete_postreqs.length) {
          largest = tasks.value[i]!
        }
      }
      openUpdateTaskDialog(largest)
    }
  }
</script>
