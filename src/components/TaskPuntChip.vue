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
  import { DateTime } from 'luxon'
  import type { Task } from 'src/stores/tasks/task-model'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { handleError, notifySuccess } from 'src/utils/notification-utils'

  interface Prop {
    task: Task
  }
  const props = defineProps<Prop>()

  const DEFAULT_DATE_FORMAT = 'LLLL d, yyyy -'
  const DEFAULT_TIME_FORMAT = 'h:mm a ZZZZ'
  const DEFAULT_DATETIME_FORMAT = DEFAULT_DATE_FORMAT + ' ' + DEFAULT_TIME_FORMAT

  const puntOptions = [
    { label: '+D', unit: 'days' as const },
    { label: '+W', unit: 'weeks' as const },
    { label: '+M', unit: 'months' as const }
  ]

  function punt(option: { label: string; unit: 'days' | 'weeks' | 'months' }) {
    const base = props.task.deadline_at ? DateTime.fromISO(props.task.deadline_at) : DateTime.now()

    console.log({ base: base.toFormat(DEFAULT_DATETIME_FORMAT) })

    // Extract time components from the original deadline to preserve them
    const originalTime = props.task.deadline_at
      ? {
        hour: base.hour,
        minute: base.minute,
        second: base.second,
        millisecond: base.millisecond
      }
      : null

    let newDate = base
    do {
      newDate = newDate.plus({ [option.unit]: 1 })
      console.log({ newDate: newDate.toFormat(DEFAULT_DATETIME_FORMAT) })
    } while (newDate <= DateTime.now())

    // Reapply the original time to ensure it's preserved
    // This handles edge cases where the time might get lost during date arithmetic
    if (originalTime) {
      newDate = newDate.set(originalTime)
    }

    console.log({ finalDate: newDate.toFormat(DEFAULT_DATETIME_FORMAT) })

    useTaskStore()
      .apiUpdate(props.task.id, { deadline_at: newDate.toISO()! })
      .then(() => notifySuccess('Deadline punted'), handleError('Error updating deadline'))
  }
</script>
