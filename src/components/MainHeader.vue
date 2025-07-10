<template>
  <q-header elevated>
    <q-toolbar>
      <HeaderButtons v-model:drawer="drawer" v-model:tasks="tasks" />

      <q-space />

      <HeaderUserMenu />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import HeaderButtons from 'src/components/HeaderButtons.vue'
  import HeaderUserMenu from 'src/components/HeaderUserMenu.vue'
  import type { Task } from 'src/stores/tasks/task-model'
  import { useTaskTimerStore } from 'src/stores/tasks/task-timer'
  import TrayTimer from './TrayTimer.vue'

  const { minimized } = storeToRefs(useTaskTimerStore())

  const drawer = defineModel<boolean>('drawer')
  const tasks = defineModel<Array<Task>>('tasks', { required: true })
</script>
