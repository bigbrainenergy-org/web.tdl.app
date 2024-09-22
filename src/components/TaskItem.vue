<template>
  <q-item v-ripple clickable data-cy="task_item" @click="$emit('task-clicked', $event, task)">
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

    <q-item-section v-if="task.incomplete_postreqs.length" side>
      <q-chip
        :style="
          task.incomplete_postreqs.length > postreqQuantityWarningThreshold
            ? 'background-color: red;'
            : 'background-color: gray;'
        "
      >
        {{ task.incomplete_postreqs.length }}
      </q-chip>
    </q-item-section>
    <q-item-section side>
      <q-btn
        v-if="!task.completed"
        outline
        rounded
        label="ADD PRE"
        @click.stop="addTaskPre(task)"
      />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
  import { toRef } from 'vue'
  import { usePostreqWarning } from 'src/composables/use-postreq-warning'
  import { addPrerequisitesDialog } from 'src/utils/dialog-utils'
  import { Task } from 'src/stores/tasks/task-model'

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
  const addTaskPre = (currentTask: Task) => addPrerequisitesDialog(currentTask)
  const { postreqQuantityWarningThreshold } = usePostreqWarning()
</script>

<style>
  .q-checkbox__icon {
    font-size: 0.75em;
  }
</style>
