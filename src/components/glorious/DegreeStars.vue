<template>
  <span class="degree-stars" :class="{ 'degree-stars--readonly': readonly }">
    <q-icon
      v-for="n in 3"
      :key="n"
      :name="n <= (modelValue ?? 0) ? 'fa-solid fa-star' : 'fa-regular fa-star'"
      :color="n <= (modelValue ?? 0) ? 'amber' : 'grey'"
      :size="size"
      class="degree-star"
      @click.stop="!readonly && handleClick(n as 1 | 2 | 3)"
    />
    <span v-if="label" class="q-ml-xs text-caption">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
  interface Props {
    modelValue: 1 | 2 | 3 | null
    readonly?: boolean
    size?: string
    label?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    readonly: false,
    size: 'xs',
    label: undefined
  })

  const emit = defineEmits<{
    'update:modelValue': [value: 1 | 2 | 3 | null]
  }>()

  const handleClick = (n: 1 | 2 | 3) => {
    emit('update:modelValue', n === props.modelValue ? null : n)
  }
</script>

<style scoped>
  .degree-stars {
    display: inline-flex;
    align-items: center;
    gap: 1px;
  }
  .degree-star {
    cursor: pointer;
  }
  .degree-stars--readonly .degree-star {
    cursor: default;
  }
</style>
