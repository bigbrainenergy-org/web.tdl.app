<template>
  <q-datetime-input
    v-model="editRemindMeAt"
    label="Remind me at"
    class="q-my-md"
    @update:model-value="updateTask(task.id, { remind_me_at: editRemindMeAt })"
  />
</template>

<script setup lang="ts">
  import QDatetimeInput from 'src/components/QDatetimeInput.vue'

  import { Task } from 'src/stores/tasks/task-model'
  import { updateTask } from 'src/utils/task-utils'
  import { ref } from 'vue'

  const task = defineModel<Task>('task', { required: true })

  const editRemindMeAt = ref(task.value.remind_me_at)
</script>
