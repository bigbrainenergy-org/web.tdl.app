<template>
  <q-item v-ripple clickable data-cy="task_item" @click="$emit('task-clicked', $event, task)">
    <q-menu
      touch-position
      context-menu
    >
      <q-list dense style="min-width: 180px">
        <MenuListItem v-for="(menuitem, index) in menuItems" :key="index" :menu-item="menuitem" :item="task" />
      </q-list>
    </q-menu>
    <q-checkbox
      v-model:model-value="task.completed"
      color="primary"
      keep-color
      checked-icon="task_alt"
      unchecked-icon="radio_button_unchecked"
      class="q-mr-sm"
      @update:model-value="$emit('task-completion-toggled', $event, task)"
    />

    <q-item-section>
      <q-item-label data-cy="task_item_title" lines="2">
        {{ task.title }}
      </q-item-label>
    </q-item-section>

    <q-item-section v-if="task.notes" side data-cy="notes_indicator">
      <q-avatar icon="description">
        <q-tooltip anchor="center right" self="center left" :offset="[10, 10]">
          Has additional notes! Click to view.
        </q-tooltip>
      </q-avatar>
    </q-item-section>

    <TaskPostreqInfoChip :task="task" />
    <TaskTimeEstimateInfoChip :task="task" />
    
    <q-item-section side>
      <q-btn v-if="!task.completed" outline rounded label="ADD PRE" @click.stop="addPre(task)" />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
  import { toRef } from 'vue'
  import { addPrerequisitesDialog, considerOpeningQuickSortDialog, quickSortPostreqsDialog } from 'src/utils/dialog-utils'
  import type { Task } from 'src/stores/tasks/task-model'
  import TaskPostreqInfoChip from './TaskPostreqInfoChip.vue'
  import TaskTimeEstimateInfoChip from './TaskTimeEstimateInfoChip.vue'
  import type { SimpleMenuItem } from 'src/utils/types'
  import MenuListItem from './MenuListItem.vue'
  import { updateTask } from 'src/utils/task-utils'

  const props = withDefaults(
    defineProps<{
      task: Task
      incompleteOnly?: boolean
    }>(),
    {
      incompleteOnly: false
    }
  )

  defineEmits(['task-clicked', 'task-completion-toggled'])

  const task = toRef(props, 'task')

  const addPre = (task: Task) => addPrerequisitesDialog(task).onDismiss(considerOpeningQuickSortDialog).onCancel(considerOpeningQuickSortDialog)

  const updateEstimate = (est: number) => (task: Task) => {
    updateTask(task.id, { task_duration_in_minutes: est })
  }

  const menuItems: SimpleMenuItem<Task>[] = [
    {
      label: 'Mark Complete',
      icon: 'fas fa-lightbulb',
      action: async x => await x.toggleCompleted()
    },
    {
      label: 'Add Prerequisites...',
      icon: 'fas fa-lightbulb',
      action: addPre
    },
    {
      label: 'Set Estimated Time...',
      icon: 'fas fa-lightbulb',
      action: () => {},
      items: [
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
    },
    {
      label: 'Sort Postreqs...',
      icon: 'fas fa-signs-post',
      action: t => quickSortPostreqsDialog(t.id)
    }
  ]
</script>

<style>
  .q-checkbox__icon {
    font-size: 0.75em;
  }
</style>
