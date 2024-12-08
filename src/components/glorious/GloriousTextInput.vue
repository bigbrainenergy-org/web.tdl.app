<template>
  <q-input
    v-model="model"
    filled
    :label="label"
    :placeholder="placeholder"
    clearable
    class="q-my-md"
    @keyup.enter="emit('enter-key')"
  />
</template>
<script setup lang="ts">
  const model = defineModel<string>()
  defineProps<{ label: string; placeholder: string }>()
  const emit = defineEmits(['enter-key'])
</script>
