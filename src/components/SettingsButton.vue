<template>
  <q-btn icon="fa-solid fa-gear" class="text-primary">
    <q-popup-proxy class="q-pa-md" @update:model-value="console.log(settings)">
      <LazyVueComponent :data="settings" :edit="true" :name="name" :show-edit="false" />
    </q-popup-proxy>
  </q-btn>
</template>

<script setup lang="ts">
import LazyVueComponent from './lazy-vue/LazyVueComponent.vue';
const settings = defineModel<any>('settings')
defineProps<{ name: string }>()
</script>