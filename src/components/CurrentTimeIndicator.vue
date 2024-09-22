<template>
  <p>Current Time: {{ currentTime }}</p>
</template>

<script setup lang="ts">
  import { useIntervalFn } from '@vueuse/core';
  import { DateTime } from 'luxon'
  import { onActivated, onDeactivated, onMounted, ref } from 'vue';

  const currentTime = ref(DateTime.local().toFormat('h:mm:ss a ZZZZ'))

  function updateCurrentTime() {
    currentTime.value = DateTime.local().toFormat('h:mm:ss a ZZZZ')
  }

  const { pause, resume } = useIntervalFn(updateCurrentTime)

  // Immediately update so the user doesn't notice a huge time jump after 1 second
  onMounted(() => updateCurrentTime())

  onActivated(() => {
    updateCurrentTime()
    resume()
  })

  onDeactivated(() => {
    pause()
  })
</script>
