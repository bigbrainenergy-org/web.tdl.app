<template>
  <q-item v-ripple clickable data-cy="task_item" @click="$emit('task-clicked', $event, task.t)">
    <q-checkbox
      v-model:model-value="task.completed"
      color="primary"
      keep-color
      @update:model-value="$emit('task-completion-toggled', $event, task.t)"
    />

    <q-item-section>
      <q-item-label data-cy="task_item_title" lines="2">
        {{ task.title }}
      </q-item-label>
    </q-item-section>

    <q-item-section v-if="task.t.notes" side data-cy="notes_indicator">
      <q-avatar icon="description">
        <q-tooltip anchor="center right" self="center left" :offset="[10, 10]">
          Has additional notes! Click to view.
        </q-tooltip>
      </q-avatar>
    </q-item-section>

    <q-item-section v-if="task.grabPostreqs(incompleteOnly).length" side>
      <q-chip
        v-if="task.grabPostreqs(incompleteOnly).length"
        :style="
          task.grabPostreqs(incompleteOnly).length > 5
            ? 'background-color: red;'
            : 'background-color: gray;'
        "
      >
        {{ task.grabPostreqs(incompleteOnly).length }}
      </q-chip>
    </q-item-section>
    <q-item-section side>
      <q-btn
        v-if="!task.completed"
        outline
        rounded
        label="ADD PRE"
        @click.stop="addTaskPre(task.t)"
      />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
  import { ref, toRef } from 'vue'
  import { Task } from 'stores/tasks/task'
  import { TDLAPP } from 'src/TDLAPP'
  import { cachedTask } from 'src/stores/performance/all-tasks'

  const props = withDefaults(
    defineProps<{
      task: cachedTask
      incompleteOnly?: boolean
    }>(),
    {
      incompleteOnly: false
    }
  )

  defineEmits(['task-clicked', 'task-completion-toggled'])

  const task = toRef(props, 'task')
  const addTaskPre = (currentTask: Task) => TDLAPP.addPrerequisitesDialog(currentTask)
</script>
