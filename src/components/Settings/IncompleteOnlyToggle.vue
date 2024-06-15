<template>
  <q-toggle v-model="hideCompleted" label="Hide Completed Tasks" class="text-primary" left-label />
</template>
<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  const { hideCompleted } = storeToRefs(useLocalSettingsStore())
</script>
