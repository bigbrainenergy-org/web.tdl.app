<template>
  <q-circular-progress :value="progressValue" show-value size="30px">
    {{ prettyProgressValue }}
  </q-circular-progress>
</template>
<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useTaskTimerStore } from 'src/stores/tasks/task-timer'
  import { computed } from 'vue'

  const { task, timeRemaining } = storeToRefs(useTaskTimerStore())
  if(!task?.value) {
    throw new Error('no task value.')
  }
  const estDuration = (task.value.task_duration_in_minutes ?? 15)*60
  const progressValue = computed(() => 100 * timeRemaining.value / estDuration)
  const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')
  const mmss = (x: number) => `${Math.floor(x/60)}:${zeroPad(Math.floor(x)%60, 2)}`
  const prettyProgressValue = computed(() => mmss(timeRemaining.value)) // what the fuck?!
</script>