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
  import HeaderButtons from 'src/components/HeaderButtons.vue'
  import HeaderUserMenu from 'src/components/HeaderUserMenu.vue'

  const drawer = defineModel<boolean>('drawer')
  const tasks = defineModel<Array<Task>>('tasks')
</script>
