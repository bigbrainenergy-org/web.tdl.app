<template>
  <GloriousTextInput
    v-model="editTitle"
    label="Task Title"
    :placeholder="task.title"
    data-cy="task_title_input"
    @enter-key="task.title = editTitle"
  />
</template>

<script setup lang="ts">
  import GloriousTextInput from 'src/components/GloriousTextInput.vue'

  import { Task } from 'src/stores/tasks/task-model'
  import { ref } from 'vue'

  const task = defineModel<Task>('task', { required: true })

  const editTitle = ref(task.value.title)
</script>
