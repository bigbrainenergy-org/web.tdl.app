<template>
  <q-item-section side>
    <q-btn outline rounded @click.stop="startTimer(task)">
      <TheBestTransition>
        <span v-if="hover" color="white">
          {{ task.task_duration_in_minutes ? `${task.task_duration_in_minutes}m` : 'TIME TBD' }}
        </span>
      </TheBestTransition>
      <q-icon :name="task.task_duration_in_minutes ? 'play_arrow' : 'fas fa-question'" color="white" />
      <q-menu v-if="!task.task_duration_in_minutes" auto-close>
        <q-list style="min-width: 100px">
          <MenuListItem v-for="(menuItem, index) in menuitems" :key="index" :menu-item="menuItem" :item="task" />
        </q-list>
      </q-menu>
    </q-btn>
  </q-item-section>
</template>
<script setup lang="ts">
  import { considerOpeningQuickSortDialog, openTimer } from 'src/utils/dialog-utils'
  import MenuListItem from './MenuListItem.vue'
  import type { SimpleMenuItem } from 'src/utils/types'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { handleError, notifySuccess } from 'src/utils/notification-utils'
  import type { Task } from 'src/stores/tasks/task-model'
  import TheBestTransition from './TheBestTransition.vue'

  interface Prop {
    task: Task
    hover: boolean
  }
  defineProps<Prop>()

  const startTimer = (task: Task) => {
    if(task.task_duration_in_minutes) openTimer(task).onDismiss(considerOpeningQuickSortDialog).onCancel(considerOpeningQuickSortDialog).onOk(considerOpeningQuickSortDialog)
  }

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