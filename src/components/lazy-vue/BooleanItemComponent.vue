<script setup lang="ts">
  import { computed } from 'vue'
  import { QBadge } from 'quasar'
  import { PropStructure } from './lazyVueUtils'
  const data = defineModel<boolean>('data', {
    set: (x) => {
      emit('updateme')
      return x
    }
  })
  withDefaults(defineProps<PropStructure>(), {
    config: 'pretty',
    edit: false
  })
  const emit = defineEmits(['updateme'])
  const formattedText = computed(() => (data.value ? 'TRUE' : 'FALSE'))
</script>

<template>
  <q-item>
    <q-item-section>
      <q-item-label lines="2">{{ name }}</q-item-label>
    </q-item-section>
    <q-toggle v-if="edit" v-model="data" class="q-ml-sm" />
    <QBadge v-else :label="formattedText" class="q-ml-sm" />
  </q-item>
</template>
