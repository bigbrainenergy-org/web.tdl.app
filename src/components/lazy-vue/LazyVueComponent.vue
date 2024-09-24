<script setup lang="ts">
  import { GenericPropStructure, isArray, isNotArray } from './lazyVueUtils'
  import ArrayComponent from './ArrayComponent.vue'
  import EditModeSwitch from './EditModeSwitch.vue'
  import SingularComponent from './SingularComponent.vue'
  import { isRef } from 'vue'

  const data = defineModel<any>('data')
  const edit = defineModel<boolean | undefined>('edit')
  withDefaults(defineProps<GenericPropStructure>(), { showEdit: true })
  edit.value = edit.value ?? false
</script>
<template>
  <EditModeSwitch v-if="showEdit" v-model="edit" />
  <div v-if="isRef(data)">
    <LazyVueComponent
      v-model:data="data.value"
      v-model:edit="edit"
      :show-edit="showEdit"
      :name="name"
    />
  </div>
  <div v-else>
    <q-item-label v-if="typeof data === 'undefined'">
      UNDEFINED, NULL, OR UNSUPPORTED TYPE
    </q-item-label>
    <ArrayComponent
      v-else-if="isArray(data)"
      v-model:data="data"
      v-model:edit="edit"
      :name="name"
      :show-edit="false"
    />
    <SingularComponent
      v-else-if="isNotArray(data)"
      v-model:data="data"
      v-model:edit="edit"
      :name="name"
      :show-edit="false"
    />
  </div>
</template>
