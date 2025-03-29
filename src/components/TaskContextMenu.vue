<template>
  <q-menu context-menu auto-close>
    <q-list>
      <q-item clickable>
        <q-item-section side>
          <q-icon name="edit" />
        </q-item-section>
        <q-item-section>Edit Task</q-item-section>
      </q-item>
      <q-item clickable>
        <q-item-section side>
          <q-icon name="fa fa-list" />
        </q-item-section>
        <q-item-section>Go to List</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable @click="addPrerequisitesDialog(task)">
        <q-item-section side>
          <q-icon name="subdirectory_arrow_left" />
        </q-item-section>
        <q-item-section>Add Prerequisite</q-item-section>
      </q-item>
      <q-item clickable>
        <q-item-section side>
          <q-icon name="subdirectory_arrow_right" />
        </q-item-section>
        <q-item-section>Add Postrequisite</q-item-section>
      </q-item>
      <q-item clickable>
        <q-item-section side>
          <q-icon name="fa fa-tasks" />
        </q-item-section>
        <q-item-section>Add Subtask</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
  import { Task } from 'src/stores/tasks/task-model';
  import { addPrerequisitesDialog } from 'src/utils/dialog-utils'
  import { toRef } from 'vue';

  const props = defineProps<{
    task: Task
  }>()

  const task = toRef(props, 'task')
</script>
