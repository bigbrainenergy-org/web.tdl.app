<template>
  <q-list dense style="min-width: 180px">
    <MenuListItem v-for="(menuitem, index) in menuItems" :key="index" :menu-item="menuitem" :item="task" />
  </q-list>
</template>

<script setup lang="ts">
  import { addPrerequisitesDialog, considerOpeningQuickSortDialog, quickSortPostreqsDialog, openUpdateTaskDialog, openUpdateTaskDialog2, openTaskBreakdownDialog } from 'src/utils/dialog-utils'
  import type { Task } from 'src/stores/tasks/task-model'
  import type { SimpleMenuItem } from 'src/utils/types'
  import MenuListItem from './MenuListItem.vue'
  import { updateTask } from 'src/utils/task-utils'
  import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
  import { useTaskNeedsRefinementStore } from 'src/stores/tasks/task-needs-refinement'

  const props = defineProps<{
    task: Task
  }>()

  const starredStore = useTaskStarredStore()
  const needsRefinementStore = useTaskNeedsRefinementStore()

  const addPre = (task: Task) => addPrerequisitesDialog(task).onDismiss(considerOpeningQuickSortDialog).onCancel(considerOpeningQuickSortDialog)

  const updateEstimate = (est: number) => (task: Task) => {
    updateTask(task.id, { task_duration_in_minutes: est })
  }

  const toggleStar = (task: Task) => {
    starredStore.toggle(task.id)
  }

  const toggleNeedsRefinement = (task: Task) => {
    needsRefinementStore.toggle(task.id)
  }

  const menuItems: SimpleMenuItem<Task>[] = [
    {
      label: 'Details',
      icon: 'info',
      action: openUpdateTaskDialog
    },
    {
      label: 'Details 2.0',
      icon: 'hub',
      action: openUpdateTaskDialog2
    },
    {
      label: 'Mark Complete',
      icon: 'fas fa-lightbulb',
      action: async x => await x.toggleCompleted()
    },
    {
      label: 'Toggle Star',
      icon: 'fas fa-star',
      action: toggleStar
    },
    {
      label: 'Needs Refinement',
      icon: 'build',
      action: toggleNeedsRefinement
    },
    {
      label: 'Break Down Task...',
      icon: 'call_split',
      action: (task: Task) => openTaskBreakdownDialog(task)
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
