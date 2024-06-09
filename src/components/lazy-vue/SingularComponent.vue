<script setup lang="ts">
import { GenericPropStructure, Singular, isSingularObject, isSingularPrimitive, isArray } from './lazyVueUtils'
import SingularPrimitiveComponent from './SingularPrimitiveComponent.vue'
import ObjectComponent from './ObjectComponent.vue'
import EditModeSwitch from './EditModeSwitch.vue'

const data = defineModel<Singular>('data')
if (isArray(data.value)) throw new Error('SingularComponent: data provided was not ')
const edit = defineModel<boolean | undefined>('edit')
withDefaults(defineProps<GenericPropStructure>(), { showEdit: true })
edit.value = edit.value ?? false
</script>

<template>
 <div>
  <EditModeSwitch v-if="showEdit" v-model="edit" />
  <ObjectComponent
    v-else-if="isSingularObject(data)"
    v-model:data="data"
    v-model:edit="edit"
    :name="name"
    :show-edit="false" />
  <SingularPrimitiveComponent
    v-else-if="isSingularPrimitive(data)"
    v-model:data="data"
    v-model:edit="edit"
    :name="name"
    :show-edit="false" />
 </div>
</template>
