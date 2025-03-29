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
      <q-item-label caption lines="2" v-if="task.notes">
        {{ task.notes }}
      </q-item-label>
      <q-item-label caption v-if="showMetadata">
        <TaskMetadata
          v-if="!!task.remind_me_at"
          icon="notifications_active"
          :content="datetimeToString(task.remind_me_at)"
        />
        <TaskMetadata
          v-if="!!task.deadline_at"
          icon="fa fa-calendar-day"
          content="Today"
        />
        <TaskMetadata
          icon="description"
          content="Notes"
          tooltip="Has additional notes! Click to view."
        />
        <TaskMetadata
          icon="fa fa-tag"
          content="Tag here"
          clickable
          @metadata-clicked="alert"
        />
        <TaskMetadata
          icon="fa fa-list"
          :content="task.list?.title || 'List Name Here'"
          clickable
          @metadata-clicked="alert"
        />
      </q-item-label>
    </q-item-section>

    <!-- <q-item-section v-if="task.notes" side data-cy="notes_indicator">
      <q-avatar icon="description">
        <q-tooltip anchor="center right" self="center left" :offset="[10, 10]">
          Has additional notes! Click to view.
        </q-tooltip>
      </q-avatar>
    </q-item-section>

    <q-item-section v-if="taskIncompletePostreqLength" side>
      <q-chip v-if="taskIncompletePostreqLength" :style="taskPostreqColor">
        {{ taskIncompletePostreqLength }}
      </q-chip>
    </q-item-section> -->
    <TaskContextMenu :task="task" />
  </q-item>
</template>

<script setup lang="ts">
  import TaskMetadata from './TaskMetadata.vue'
  import TaskContextMenu from './TaskContextMenu.vue'

  import { computed, toRef } from 'vue'
  import { usePostreqWarning } from 'src/composables/use-postreq-warning'
  import { Task } from 'src/stores/tasks/task-model'
  import { useQuasar } from 'quasar'
import { datetimeToString } from 'src/utils/luxon-utils'

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
  const taskIncompletePostreqLength = computed(
    // REVIEW: grabPostreqs is likely a source of significant lag
    () => task.value.incomplete_postreqs.length
  )
  const taskPostreqColor = computed(
    () => taskIncompletePostreqLength.value > postreqQuantityWarningThreshold.value
      ? 'background-color: red;'
      : 'background-color: gray;'
  )
  const { postreqQuantityWarningThreshold } = usePostreqWarning()

  const showMetadata = computed(
    () => {
      return (
        !!(task.value.notes) ||
        !!(task.value.remind_me_at)
    )
    }
  )

  const $q = useQuasar()

  function alert () {
    $q.dialog({
      title: 'Alert',
      message: 'Some message'
    }).onOk(() => {
      // console.log('OK')
    }).onCancel(() => {
      // console.log('Cancel')
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    })
  }
</script>

<style>
  .q-checkbox__icon {
    font-size: 0.75em;
  }
</style>
