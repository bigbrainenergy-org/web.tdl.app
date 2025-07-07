<template>
  <q-item-section side>
    <q-btn v-if="task.task_duration_in_minutes" outline rounded @click.stop="startTimer(task)">
      {{ task.task_duration_in_minutes }}m
      <q-icon name="play_arrow" color="white" />
    </q-btn>
    <q-btn v-else icon="play_arrow" class="text-white" outline rounded @click.stop="() => {}">
      <q-menu auto-close>
        <q-list style="min-width: 100px">
          <MenuListItem v-for="(menuItem, index) in menuitems" :key="index" :menu-item="menuItem" :item="task" />
        </q-list>
      </q-menu>
    </q-btn>
  </q-item-section>
</template>
<script setup lang="ts">
  import type { Task } from 'src/stores/tasks/task-model'
  import { considerOpeningQuickSortDialog, openTimer } from 'src/utils/dialog-utils'
  import MenuListItem from './MenuListItem.vue'
  import type { SimpleMenuItem } from 'src/utils/types'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { handleError, notifySuccess } from 'src/utils/notification-utils'

  interface Prop {
    task: Task
  }
  defineProps<Prop>()

  const startTimer = (task: Task) => openTimer(task).onDismiss(considerOpeningQuickSortDialog).onCancel(considerOpeningQuickSortDialog)

  const updateEstimate = (est: number) => (task: Task) => {
    useTaskStore().apiUpdate(task.id, { task_duration_in_minutes: est }).then(() => {
      notifySuccess('Task Duration was Updated')
      task.task_duration_in_minutes = est
      startTimer(task)
    }, handleError('Error updating task'))
  }

  const menuitems: SimpleMenuItem<Task>[] = [
    {
      label: 'FAST',
      icon: 'rocket',
      action: updateEstimate(5)
    },
    {
      label: '10 minutes',
      icon: 'clock',
      action: updateEstimate(10)
    },
    {
      label: '15 minutes',
      icon: 'clock',
      action: updateEstimate(15)
    },
    {
      label: '30 minutes',
      icon: 'clock',
      action: updateEstimate(30)
    },
    {
      label: '45 minutes',
      icon: 'clock',
      action: updateEstimate(45)
    },
    {
      label: '75 minutes',
      icon: 'clock',
      action: updateEstimate(75)
    }
  ]
</script>