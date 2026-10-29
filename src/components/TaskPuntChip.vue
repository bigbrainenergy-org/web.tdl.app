<template>
  <q-item-section side>
    <q-btn outline rounded size="sm">
      <span>Punt</span>
      <q-menu auto-close>
        <q-list style="min-width: 80px">
          <q-item v-for="option in puntOptions" :key="option.label" clickable @click="punt(option)">
            <q-item-section>{{ option.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </q-item-section>
</template>

<script setup lang="ts">
  import type { Task } from 'src/stores/tasks/task-model'
  import { puntTask } from 'src/utils/task-utils'

  interface Prop {
    task: Task
  }
  const props = defineProps<Prop>()

  const puntOptions = [
    { label: '+D', unit: 'days' as const },
    { label: '+W', unit: 'weeks' as const },
    { label: '+M', unit: 'months' as const }
  ]

  function punt(option: { label: string; unit: 'days' | 'weeks' | 'months' }) {
    puntTask(props.task, option.unit)
  }
</script>
