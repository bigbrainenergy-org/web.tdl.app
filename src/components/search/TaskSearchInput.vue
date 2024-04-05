<template>
  <q-input
    v-model="search"
    filled
    clearable
    debounce="400"
    :label="searchLabel"
    @update:model-value="emit('doASearch')"
    @keyup.enter="emit('doASearch')" >
    <template #append>
      <q-btn
        round
        flat
        dense
        icon="search"
        @click="emit('doASearch')"
      />
    </template>
  </q-input>
</template>
<script setup lang="ts">
const search = defineModel<string | undefined>({ required: true })
const emit = defineEmits([ 'doASearch' ])
defineProps<{ searchLabel: string }>()
</script>