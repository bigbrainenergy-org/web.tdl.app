<template>
  <q-btn
    v-for="(button, key) in buttons"
    :key="key"
    class="q-ma-sm"
    size="md"
    :color="button.color"
    :label="button.label"
    :data-cy="button.dataCy"
    @click.stop="button.action(target as G)"
  />
</template>
<script setup lang="ts" generic="G">
  import { Button } from 'src/types'
  const props = defineProps<{ buttons: Array<Button<G>>; target?: G }>()
  if (typeof props.target === 'undefined') {
    if (props.buttons.some((x) => x.action.length === 1)) {
      throw new Error('ButtonBar: no target passed in but a button action expects it.')
    }
  }
</script>
