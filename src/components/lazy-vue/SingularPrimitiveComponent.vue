<script setup lang="ts">
  import BooleanItemComponent from './BooleanItemComponent.vue'
  import EditModeSwitch from './EditModeSwitch.vue'
  import PlaintextItemComponent from './PlaintextItemComponent.vue'
  import { GenericPropStructure, SingularPrimitive, isSingularPrimitive } from './lazyVueUtils'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = defineModel<SingularPrimitive>('data')
  if (!isSingularPrimitive(data.value))
    throw new Error('SingularPrimitiveComponent: provided data was not a singular primitive!')
  const edit = defineModel<boolean | undefined>('edit')
  const props = withDefaults(defineProps<GenericPropStructure>(), {
    showEdit: true
  })
  const nbool = (x: unknown): x is boolean => x === true || x === false
  const nplaintext = (x: unknown): x is number | string =>
    typeof x === 'number' || typeof x === 'string'
  edit.value = edit.value ?? false
</script>

<template>
  <div>
    <EditModeSwitch v-if="showEdit" v-model:mode="edit" />
    <div class="row">
      <BooleanItemComponent
        v-if="nbool(data)"
        v-model:data="data"
        :name="props.name"
        :edit="edit"
        class="col"
      />
      <PlaintextItemComponent
        v-if="nplaintext(data)"
        v-model:data="data"
        :name="props.name"
        :edit="edit"
        class="col"
      />
    </div>
  </div>
</template>
