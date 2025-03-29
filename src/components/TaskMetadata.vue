<template>
  <!-- FIXME: DRY -->
  <template v-if="clickable">
    <q-avatar size="xs" :icon="icon" class="q-pa-none q-ma-none q-big-avatar" @click.stop="$emit('metadata-clicked', $event)">
      <q-tooltip v-if="tooltip" anchor="center right" self="center left" :offset="[10, 10]">
        {{ tooltip }}
      </q-tooltip>
    </q-avatar>
    <span class="q-mr-sm q-ml-xs underline-on-hover" @click.stop="$emit('metadata-clicked', $event)">
      {{ content }}
    </span>
  </template>
  <template v-else>
    <q-avatar size="xs" :icon="icon" class="q-pa-none q-ma-none q-big-avatar">
      <q-tooltip v-if="tooltip" anchor="center right" self="center left" :offset="[10, 10]">
        {{ tooltip }}
      </q-tooltip>
    </q-avatar>
    <span class="q-mr-sm q-ml-xs">
      {{ content }}
    </span>
  </template>
</template>

<script setup lang="ts">
  import { toRef } from 'vue'

  const props = withDefaults(
    defineProps<{
      icon: string
      content: string
      clickable?: boolean
      tooltip?: string
    }>(),
    {
      tooltip: '',
      clickable: false
    }
  )

  defineEmits(['metadata-clicked'])

  const icon = toRef(props, 'icon')
  const tooltip = toRef(props, 'tooltip')
  const content = toRef(props, 'content')
</script>

<style>
  .q-big-avatar > .q-avatar__content {
    font-size: 75%;
  }
  .underline-on-hover:hover {
    text-decoration-line: underline;
  }
</style>
