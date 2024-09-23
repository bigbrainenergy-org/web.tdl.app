<template>
  <q-input
    v-model="editNotes"
    filled
    autogrow
    debounce="1000"
    label="Notes"
    @update:model-value="updateTask(task.id, { notes: editNotes })"
  />
</template>

<script setup lang="ts">
  import { Task } from 'src/stores/tasks/task-model'
  import { updateTask } from 'src/utils/task-utils'
  import { ref } from 'vue'

  const task = defineModel<Task>('task', { required: true })

  const editNotes = ref(task.value.notes)
</script>
