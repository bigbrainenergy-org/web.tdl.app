<template>
  <q-item
    v-ripple
    clickable
    data-cy="task_item"
    :style="props.taskBackgroundStyle"
    @click="$emit('task-clicked', $event, task)"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <q-menu touch-position context-menu>
      <TaskItemMenu :task="task" />
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
      <q-item-label
        data-cy="task_item_title"
        lines="2"
        :style="props.isLayerZero ? 'color: green' : undefined"
      >
        {{ task.title }}
      </q-item-label>
    </q-item-section>

    <!-- Star icon for starred tasks -->
    <q-item-section v-if="props.isStarred" side>
      <q-icon name="fas fa-crown" color="amber" size="sm" @click.stop="toggleStar(task)">
        <q-tooltip>This task is starred</q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section v-if="!props.isStarred && props.hasStarredDescendants" side>
      <q-icon name="far fa-star" color="amber" size="sm">
        <q-tooltip>This task has starred descendants</q-tooltip>
      </q-icon>
    </q-item-section>

    <!-- Needs refinement icon -->
    <q-item-section v-if="props.needsRefinement && props.showRefinementIcon" side>
      <q-icon name="build" color="orange" size="sm" @click.stop="toggleNeedsRefinement(task)">
        <q-tooltip>This task needs refinement/breakdown</q-tooltip>
      </q-icon>
    </q-item-section>

    <!-- Project icon -->
    <q-item-section v-if="props.isProject" side>
      <q-icon name="fa-solid fa-folder-open" color="primary" size="sm">
        <q-tooltip>This is a project</q-tooltip>
      </q-icon>
    </q-item-section>

    <!-- Deadline badge -->
    <q-item-section v-if="props.inheritedDeadline" side>
      <q-icon
        name="event"
        :color="props.isOverdue || props.isInheritedOverdue || props.isReminderTriggered ? 'red' : 'orange'"
        size="sm"
      >
        <q-tooltip>
          <template v-if="props.inheritedDeadline.isOwn">
            {{ props.deadlineText ? `Due in ${props.deadlineText}` : 'Overdue' }}
          </template>
          <template v-else>
            {{ props.deadlineText ? `A postrequisite is due in ${props.deadlineText}` : 'A postrequisite is overdue' }}
          </template>
        </q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section v-if="task.notes" side data-cy="notes_indicator">
      <q-avatar icon="description">
        <q-tooltip anchor="center right" self="center left" :offset="[10, 10]">
          Has additional notes! Click to view.
        </q-tooltip>
      </q-avatar>
    </q-item-section>

    <template v-if="props.showActions">
      <TheBestTransition>
        <q-item-section v-if="hovered" side>
          <q-btn
            v-if="!task.completed"
            outline
            rounded
            label="ADD PRE"
            @click.stop="addPre(task)"
          />
        </q-item-section>
      </TheBestTransition>

      <!-- <TaskPostreqInfoChip :task="task" /> -->
      <TaskTimeEstimateInfoChip :task="task" :hover="hovered" />
    </template>
  </q-item>
</template>

<script setup lang="ts">
  import { ref, toRef } from 'vue'
  import { openTaskBreakdownDialog, considerOpeningQuickSortDialog } from 'src/utils/dialog-utils'
  import type { Task } from 'src/stores/tasks/task-model'
  import type { InheritedDeadlineResult } from 'src/utils/inherited-deadline'
  import TaskTimeEstimateInfoChip from './TaskTimeEstimateInfoChip.vue'
  import TaskItemMenu from './TaskItemMenu.vue'
  import TheBestTransition from './TheBestTransition.vue'
  import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
  import { useTaskNeedsRefinementStore } from 'src/stores/tasks/task-needs-refinement'
  import { useDevice } from 'src/composables/useDevice'

  const props = defineProps<{
    task: Task
    isLayerZero?: boolean
    isStarred?: boolean
    hasStarredDescendants?: boolean
    needsRefinement?: boolean
    isProject?: boolean
    isOverdue?: boolean
    isReminderTriggered?: boolean
    taskBackgroundStyle?: string
    showActions?: boolean
    showRefinementIcon?: boolean
    inheritedDeadline?: InheritedDeadlineResult
    deadlineText?: string
    isInheritedOverdue?: boolean
  }>()

  const hovered = ref(false)
  const task = toRef(props, 'task')
  const isTouchDevice = useDevice()

  defineEmits(['task-clicked', 'task-completion-toggled'])

  const onMouseEnter = () => {
    if (!isTouchDevice.value) {
      hovered.value = true
    }
  }

  const onMouseLeave = () => {
    if (!isTouchDevice.value) {
      hovered.value = false
    }
  }

  const starredStore = useTaskStarredStore()
  const needsRefinementStore = useTaskNeedsRefinementStore()

  const addPre = (task: Task) =>
    openTaskBreakdownDialog(task)
      ?.onDismiss(considerOpeningQuickSortDialog)
      .onCancel(considerOpeningQuickSortDialog)
  const toggleStar = (task: Task) => starredStore.toggle(task.id)
  const toggleNeedsRefinement = (task: Task) => needsRefinementStore.toggle(task.id)
</script>

<style>
  .q-checkbox__icon {
    font-size: 0.75em;
  }

  /* Enable transitions only on devices that support hover */
  @media (hover: hover) {
    .fade-slide-enter-active,
    .fade-slide-leave-active {
      transition:
        opacity 0.3s ease,
        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .fade-slide-enter-from,
    .fade-slide-leave-to {
      opacity: 0;
      transform: translateX(20px);
    }
    .fade-slide-enter-to,
    .fade-slide-leave-from {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Disable transitions on touch devices */
  @media (hover: none) {
    .fade-slide-enter-active,
    .fade-slide-leave-active {
      transition: none;
    }
    .fade-slide-enter-from,
    .fade-slide-leave-to,
    .fade-slide-enter-to,
    .fade-slide-leave-from {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
