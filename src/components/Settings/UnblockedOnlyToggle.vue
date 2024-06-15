<template>
  <q-toggle v-model="layerZeroOnly" label="Hide Blocked Tasks" class="text-primary" left-label />
</template>
<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  const { layerZeroOnly } = storeToRefs(useLocalSettingsStore())
</script>
