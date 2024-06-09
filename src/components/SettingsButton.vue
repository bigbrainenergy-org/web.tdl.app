<template>
  <q-btn icon="fa-solid fa-gear" :class="iconClass">
    <q-popup-proxy class="q-pa-md" @update:model-value="console.log(settings)">
      <LazyVueComponent
        :data="settings"
        :edit="true"
        :name="name"
        :show-edit="false"
      />
    </q-popup-proxy>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LazyVueComponent from './lazy-vue/LazyVueComponent.vue'
const settings = defineModel<any>('settings')
const prop = withDefaults(defineProps<{ name: string; color?: string }>(), {
  name: 'Settings',
  color: 'primary'
})
const iconClass = computed(() => `text-${prop.color}`)
</script>
