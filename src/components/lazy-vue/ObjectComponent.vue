<script setup lang="ts">
import { GenericPropStructure, WTF, isNotObject } from './lazyVueUtils'
import EditModeSwitch from './EditModeSwitch.vue'
import { ref } from 'vue'
import LazyVueComponent from './LazyVueComponent.vue'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = defineModel<any>('data')
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
if (isNotObject(data.value)) throw new Error('ObjectComponent: data provided was not an object!')
const edit = defineModel<boolean | undefined>('edit')
withDefaults(defineProps<GenericPropStructure>(), { showEdit: true })
edit.value = edit.value ?? false

const renderCue = ref(0)
const customUpdate = (/* key: string, value: WTF */) => {
// if (data.value) {
//   console.log(`key: ${key} - value: ${value}`)
//   data.value[key] = value
//   console.debug({ 'new data': data.value })
// }
  renderCue.value++
}
</script>
<template>
  <div>
    <EditModeSwitch v-if="showEdit" v-model="edit" />
    <q-item-section>
      <q-item-label lines="2">{{ name }}</q-item-label>
    </q-item-section>
    <q-list v-if="data" :key="renderCue" dense>
      <q-item v-for="item, key of Object.keys(data)" :key="key">
        <LazyVueComponent
          :key="key"
          v-model:data="data[item]"
          :name="Object.keys(data)[key]"
          :edit="edit"
          :show-edit="false"
          @update:data="(x: WTF) => customUpdate(/*item, x*/)" />
      </q-item>
    </q-list>
  </div>
</template>
