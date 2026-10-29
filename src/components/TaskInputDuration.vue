<template>
  <q-select
    v-model="duration"
    filled
    hide-selected
    fill-input
    input-debounce="20"
    :options="durationOptions"
    use-chips
    option-label="label"
    map-options
    emit-value
    label="Estimated Duration"
    use-input
    option-value="duration"
    class="q-my-md text-primary"
  />
</template>

<script setup lang="ts">
  const duration = defineModel<number | undefined>('duration')

  const durationOptions = [
    { label: 'FAST', duration: 5 },
    { label: '10 minutes', duration: 10 },
    { label: '15 minutes', duration: 15 },
    { label: '30 minutes', duration: 30 },
    { label: '45 minutes', duration: 45 },
    { label: '75 minutes', duration: 75 }
  ]
  if(typeof duration.value !== 'undefined' && !durationOptions.map(x => x.duration).includes(duration.value)) durationOptions.push({ label: `${duration.value} minutes`, duration: duration.value })
</script>