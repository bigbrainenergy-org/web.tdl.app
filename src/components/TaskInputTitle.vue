<template>
  <GloriousTextInput
    v-model="editTitle"
    label="Task Title"
    :placeholder="task.title"
    data-cy="task_title_input"
    @enter-key="updateTask(task.id, { title: editTitle })"
  />
</template>

<script setup lang="ts">
  import GloriousTextInput from 'src/components/GloriousTextInput.vue'

  import { Task } from 'src/stores/tasks/task-model'
  import { updateTask } from 'src/utils/task-utils'
  import { ref } from 'vue'

  const task = defineModel<Task>('task', { required: true })

  const editTitle = ref(task.value.title)

  // Unused because it causes unnecessary saves when task is updated (changes editTitle, which then kicks off an update)
  // Left for reference on how to do watch in this type of scenario. Can safely remove (now that it's in git history)
  // watch(
  //   () => task.value,
  //   (newValue) => {
  //     editTitle.value = newValue.title
  //   }
  // )
</script>
