<template>
  <q-badge color="secondary" class="q-mb-md"> Model: {{ selectedItems || '[]' }} </q-badge>
  <q-select
    v-model="selectedItems"
    multiple
    filled
    fill-input
    input-debounce="20"
    :options="items"
    use-chips
    option-label="title"
    map-options
    emit-value
    label="Items"
    use-input
    class="q-my-md text-primary"
  />
  <h1>{{ $t('hellofren') }}</h1>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const selectedItems = ref([{ title: 'poop' }, { title: 'pee' }])
  const items = ref([{ title: 'poop' }, { title: 'pee' }])
</script>
