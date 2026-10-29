<template>
  <q-dialog ref="dialogRef" :maximized="$q.screen.lt.md" @hide="onDialogHide">
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Tasks Requiring Action</div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator dark inset />
      
      <q-card-section>
        <div class="text-h6">Tasks Due</div>
        <q-space />
        <q-item v-if="!reminders.overdueTasks.length">
          <q-item-section>
            <strong>No overdue tasks</strong>
          </q-item-section>
        </q-item>
        <q-intersection v-for="task in reminders.overdueTasks" :key="task.id" once style="min-height: 48px">
          <div class="row items-center no-wrap">
            <div class="col">
              <TaskItem :task="task" @click="openUpdateTaskDialog(task)" />
            </div>
            <TaskPuntChip :task="task" />
          </div>
        </q-intersection>
      </q-card-section>

      <q-separator dark inset />

      <q-card-section>
        <div class="text-h6">Reminders</div>
        <q-space />
        <q-item v-if="!reminders.reminderTasks.length">
          <q-item-section>
            <strong>No reminders</strong>
          </q-item-section>
        </q-item>
        <q-intersection v-for="task in reminders.reminderTasks" :key="task.id" once style="min-height: 48px">
          <TaskItem :task="task" @click="openUpdateTaskDialog(task)" />
        </q-intersection>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent } from 'quasar'
  import { openUpdateTaskDialog } from 'src/utils/dialog-utils'
  import TaskItem from 'src/components/TaskItem.vue'
  import TaskPuntChip from 'src/components/TaskPuntChip.vue'
  import { storeToRefs } from 'pinia'
  import { useTaskStore } from 'src/stores/tasks/task-store'

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide } = useDialogPluginComponent()

  const reminders = useTaskStore().reminders

</script>