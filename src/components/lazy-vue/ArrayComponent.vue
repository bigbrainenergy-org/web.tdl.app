<script setup lang="ts">
import { GenericPropStructure, WTF, isNotArray } from './lazyVueUtils'
import EditModeSwitch from './EditModeSwitch.vue'
import LazyVueComponent from './LazyVueComponent.vue'

const data = defineModel<WTF[]>('data')
if (isNotArray(data.value))
  throw new Error('ArrayComponent: data provided was not an array!')
const edit = defineModel<boolean | undefined>('edit')
withDefaults(defineProps<GenericPropStructure>(), {
  showEdit: true
})
edit.value = edit.value ?? false
</script>
<template>
  <div>
    <EditModeSwitch v-if="showEdit" v-model="edit" />
    <q-item-section>
      <q-item-label lines="2">{{ name }}</q-item-label>
    </q-item-section>
    <q-list v-if="data">
      <q-item v-for="(item, key) of data" :key="key">
        <LazyVueComponent
          :data="item"
          :name="name + key + ':'"
          :edit="edit"
          :show-edit="false"
        />
      </q-item>
    </q-list>
  </div>
</template>
