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

    <q-item-section v-if="task.grabPostreqs(incompleteOnly).length" side>
      <q-chip
        v-if="task.grabPostreqs(incompleteOnly).length"
        :style="
          task.grabPostreqs(incompleteOnly).length > postreqQuantityWarningThreshold
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
  import checkedSfx from 'src/assets/task_checked.wav'
  import uncheckedSfx from 'src/assets/task_unchecked.wav'

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

  function play() {
    if (task.value.completed) {
      const audio = new Audio(checkedSfx)
      audio.play()
    } else {
      const audio = new Audio(uncheckedSfx)
      audio.play()
    }
  }

  // const updateTaskCompletedStatus = async (task: Task) => {
  //   play()
  //   const newStatus = task.completed
  //   await tasksRepo.updateAndCache({ id: task.id, payload: { task } }).then((result) => {
  //     if (result.completed !== newStatus) throw new Error('error saving completed status of task')
  //     // useAllTasksStore().completion(task.id, newStatus)
  //     notifyUpdatedCompletionStatus(result)
  //     console.debug({ 'Agenda updateTaskCompletedStatus task result': result })
  //   }, handleError('Error updating completion status of a task.'))
  // }

  const task = toRef(props, 'task')
  const addTaskPre = (currentTask: Task) => addPrerequisitesDialog(currentTask)
  const { postreqQuantityWarningThreshold } = usePostreqWarning()
</script>

<style>
  .q-checkbox__icon {
    font-size: 0.75em;
  }
</style>
