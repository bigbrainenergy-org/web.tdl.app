<template>
  <q-footer elevated class="bg-grey-8 text-white">
    <q-tabs shrink :inline-label="!$q.screen.lt.sm" :dense="$q.screen.lt.sm" align="justify">
      <q-route-tab
        v-for="button in enabledToolbarButtons"
        :key="button.to"
        v-bind="button"
        style="width: 95px"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
    </q-tabs>
  </q-footer>
</template>

<script setup lang="ts">
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { computed } from 'vue'

  const enabledToolbarButtons = computed(() =>
    useLocalSettingsStore().toolbarButtons.filter((x) => x.enabled)
  )
</script>
