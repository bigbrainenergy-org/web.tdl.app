<template>
  <q-item>
    <q-item-section v-if="label">
      <q-item-label lines="2">{{ label }}</q-item-label>
    </q-item-section>
    <q-toggle v-model="val" class="q-ml-sm" />
  </q-item>
</template>
<script setup lang="ts">
const props = defineProps<{ label?: string }>()
const val = defineModel<boolean>()
</script>