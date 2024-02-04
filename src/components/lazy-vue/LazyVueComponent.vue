<script setup lang="ts">
import { GenericPropStructure, isArray, isNotArray } from './lazyVueUtils'
import ArrayComponent from './ArrayComponent.vue'
import EditModeSwitch from './EditModeSwitch.vue'
import SingularComponent from './SingularComponent.vue'
import { isRef } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = defineModel<any>('data')
const edit = defineModel<boolean | undefined>('edit')
withDefaults(defineProps<GenericPropStructure>(), { showEdit: true })
edit.value = edit.value ?? false
</script>
<template>
  <EditModeSwitch v-if="showEdit" v-model="edit" />
  <div v-if="isRef(data)">
    <q-item-label v-if="(typeof data.value === 'undefined')">UNDEFINED, NULL, OR UNSUPPORTED TYPE</q-item-label>
    <ArrayComponent
      v-else-if="isArray(data.value)"
      :name="name"
      v-model:data="data.value"
      v-model:edit="edit"
      :show-edit="false" />
    <SingularComponent
      v-else-if="isNotArray(data.value)"
      :name="name"
      v-model:data="data.value"
      v-model:edit="edit"
      :show-edit="false" />
  </div>
  <div v-else>
    <q-item-label v-if="(typeof data === 'undefined')">UNDEFINED, NULL, OR UNSUPPORTED TYPE</q-item-label>
    <ArrayComponent
      v-else-if="isArray(data)"
      :name="name"
      v-model:data="data"
      v-model:edit="edit"
      :show-edit="false" />
    <SingularComponent
      v-else-if="isNotArray(data)"
      :name="name"
      v-model:data="data"
      v-model:edit="edit"
      :show-edit="false" />
  </div>
</template>
