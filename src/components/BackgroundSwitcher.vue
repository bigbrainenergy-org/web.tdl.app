<template>
  <p>Background Mode</p>
  <q-btn-toggle
    v-model="backgroundMode"
    toggle-color="primary"
    :options="backgroundOptions"
    label="Background Theme"
    @update:model-value="updateBackgroundMode"
  />
</template>
<script setup lang="ts">
  import { BackgroundMode, useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { ref } from 'vue'

  const backgroundMode = ref<BackgroundMode>(useLocalSettingsStore().backgroundMode)
  const backgroundOptions: { label: string; value: BackgroundMode }[] = [
    { label: 'Ocean Image', value: 'image' },
    { label: 'Solid Black', value: '#000000' },
    { label: 'Dark Red', value: '#220000' }
  ]
  const updateBackgroundMode = () => {
    useLocalSettingsStore().backgroundMode = backgroundMode.value
  }
</script>
