<template>
  <q-select
    v-model="defaultPage"
    class="q-my-md"
    filled
    :options="enabledToolbarButtons"
    option-label="label"
    label="Default Page"
    @update:model-value="updateDefaultPage"
  />
</template>
<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { RouteTab, useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { computed, ref } from 'vue'
  const { toolbarButtons } = storeToRefs(useLocalSettingsStore())
  const enabledToolbarButtons = computed(() => toolbarButtons.value.filter((x) => x.enabled))
  const defaultPage = ref<RouteTab | undefined>(toolbarButtons.value.filter((x) => x.default).pop())
  const updateDefaultPage = (newVal: RouteTab) => {
    newVal.default = true
    toolbarButtons.value.forEach((x) => {
      if (x.to !== newVal.to) {
        x.default = false
      }
    })
    console.debug({ toolbarButtons })
  }
</script>
