<template>
  <q-select
    v-model="selectedDuration"
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
    @update:model-value="updateDuration"
  />
</template>

<script setup lang="ts">
  import type { Task } from 'src/stores/tasks/task-model'
  import { updateTask } from 'src/utils/task-utils'
  import { ref, watch } from 'vue'

  const task = defineModel<Task>('task', { required: true })
  const durationOptions = [
    { label: 'FAST', duration: 5 },
    { label: '10 minutes', duration: 10 },
    { label: '15 minutes', duration: 15 },
    { label: '30 minutes', duration: 30 },
    { label: '45 minutes', duration: 45 },
    { label: '75 minutes', duration: 75 }
  ]
  const selectedDuration = ref(task.value.task_duration_in_minutes ?? undefined)
  if(typeof selectedDuration.value !== 'undefined' && !durationOptions.map(x => x.duration).includes(task.value.task_duration_in_minutes!)) durationOptions.push({ label: `${selectedDuration.value} minutes`, duration: selectedDuration.value })

  const updateDuration = () => {
    console.log({ id: task.value.id, task_duration_in_minutes: selectedDuration.value })
    updateTask(task.value.id, { task_duration_in_minutes: selectedDuration.value })
  }

  watch(selectedDuration, val => console.log({ newDuration: val }))
</script>