<template>
  <div class="text-h6 text-pain" :data-cy="props.dataCy">
    <slot />
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{ dataCy?: string }>()
</script>
