<script setup lang="ts">
  import { QBadge } from 'quasar'
  import { PropStructure } from './lazyVueUtils'
  import { computed, onBeforeUpdate, ref } from 'vue'

  // todo: don't do a badge once the item length gets really long
  // todo: handle numbers differently, possibly break off into own component
  // todo: toggle editable
  const data = defineModel<string | number>('data')
  withDefaults(defineProps<PropStructure>(), {
    edit: false
  })
  const val = ref(data.value)
  const ntext = (x: string | number | undefined): x is string => typeof x === 'string'
  const isText = computed(() => ntext(data.value))
  const bump = () => {
    if (data.value === val.value) return
    data.value = val.value
    console.log(`bump ${data.value}`)
  }
  onBeforeUpdate(bump)
</script>
<template>
  <q-item>
    <q-item-section>
      <q-item-label lines="2">{{ name }}</q-item-label>
    </q-item-section>
    <q-input
      v-if="edit && isText"
      v-model="val"
      class="q-ml-sm"
      dense
      debounce="400"
      @keyup.enter="bump"
    />
    <q-input
      v-else-if="edit && !isText"
      v-model.number="val"
      class="q-ml-sm"
      type="number"
      dense
      debounce="400"
      @keyup.enter="bump"
      @update:model-value="bump"
    />
    <QBadge v-else :label="data" class="q-ml-sm" />
  </q-item>
</template>
