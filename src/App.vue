<template>
  <suspense>
    <router-view />
  </suspense>
</template>

<script setup lang="ts">
  import { onBeforeUnmount } from 'vue'
  import { useTaskTimerStore } from './stores/tasks/task-timer'

  onBeforeUnmount(() => {
    useTaskTimerStore().resetTimer()
  })
</script>

<style lang="css" scoped>
  html {
    overscroll-behavior: none;
  }
</style>
