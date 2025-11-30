<template>
  <q-item v-ripple clickable data-cy="task_item" @click="$emit('task-clicked', $event, task)" @mouseenter="hovered = true" @mouseleave="hovered = false">
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
      <q-item-label data-cy="task_item_title" lines="2" :style="task.grabPrereqs(true).length === 0 ? 'color: green' : undefined">
        {{ task.title }}
      </q-item-label>
    </q-item-section>

    <!-- Star icon for starred tasks -->
    <q-item-section v-if="isStarred" side>
      <q-icon name="fas fa-crown" color="amber" size="sm" @click.stop="toggleStar(task)">
        <q-tooltip>This task is starred</q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section v-if="!isStarred && hasStarredDescendants" side>
      <q-icon name="far fa-star" color="amber" size="sm">
        <q-tooltip>This task has starred descendants</q-tooltip>
      </q-icon>
    </q-item-section>

    <!-- Needs refinement icon -->
    <q-item-section v-if="needsRefinement" side>
      <q-icon name="build" color="orange" size="sm" @click.stop="toggleNeedsRefinement(task)">
        <q-tooltip>This task needs refinement/breakdown</q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section v-if="task.notes" side data-cy="notes_indicator">
      <q-avatar icon="description">
        <q-tooltip anchor="center right" self="center left" :offset="[10, 10]">
          Has additional notes! Click to view.
        </q-tooltip>
      </q-avatar>
    </q-item-section>
    
    <TheBestTransition>
      <q-item-section v-if="hovered" side>
        <q-btn v-if="!task.completed" outline rounded label="ADD PRE" @click.stop="addPre(task)" />
      </q-item-section>
    </TheBestTransition>

    <!-- <TaskPostreqInfoChip :task="task" /> -->
    <TaskTimeEstimateInfoChip :task="task" :hover="hovered" />
  </q-item>
</template>

<script setup lang="ts">
  import { ref, toRef, computed } from 'vue'
  import { addPrerequisitesDialog, considerOpeningQuickSortDialog, quickSortPostreqsDialog } from 'src/utils/dialog-utils'
  import type { Task } from 'src/stores/tasks/task-model'
  import TaskTimeEstimateInfoChip from './TaskTimeEstimateInfoChip.vue'
  import type { SimpleMenuItem } from 'src/utils/types'
  import MenuListItem from './MenuListItem.vue'
  import { updateTask } from 'src/utils/task-utils'
  import TheBestTransition from './TheBestTransition.vue'
  import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
  import { useTaskNeedsRefinementStore } from 'src/stores/tasks/task-needs-refinement'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { openTaskBreakdownDialog } from 'src/utils/dialog-utils'

  const props = withDefaults(
    defineProps<{
      task: Task
      incompleteOnly?: boolean
    }>(),
    {
      incompleteOnly: false
    }
  )

  const hovered = ref(false)

  defineEmits(['task-clicked', 'task-completion-toggled'])

  const task = toRef(props, 'task')

  const starredStore = useTaskStarredStore()
  const needsRefinementStore = useTaskNeedsRefinementStore()

  // Computed property to get current starred status
  const isStarred = computed(() => starredStore.isStarred(task.value.id))
  const hasStarredDescendants = computed(() => starredStore.getStarredDescendantCount(task.value.id))

  // Computed property to get needs refinement status
  const needsRefinement = computed(() => needsRefinementStore.needsRefinement(task.value.id))

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

<style>
  .q-checkbox__icon {
    font-size: 0.75em;
  }
  .fade-slide-enter-active, .fade-slide-leave-active {
    transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fade-slide-enter-from, .fade-slide-leave-to {
    opacity: 0;
    transform: translateX(20px);
  }
  .fade-slide-enter-to, .fade-slide-leave-from {
    opacity: 1;
    transform: translateX(0);
  }
</style>
