<template>
  <p>Notification Message Speed</p>
  <q-btn-toggle
    v-model="notificationSpeed"
    toggle-color="primary"
    :options="notificationSpeedOptions"
    label="Notification Duration"
  />
</template>
<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'

  const notificationSpeedOptions = [
    { label: 'Fast', value: 1 },
    { label: 'Med', value: 2 },
    { label: 'Slow', value: 3 }
  ]
  const localSettingsStore = useLocalSettingsStore()
  const { notificationSpeed } = storeToRefs(localSettingsStore)
</script>
