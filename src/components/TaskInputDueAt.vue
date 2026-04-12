<template>
  <q-datetime-input
    v-model="editDeadline"
    label="Deadline"
    class="q-my-md"
    :default-time="localSettings.defaultDueTime"
    @update:model-value="updateTask(task.id, { deadline_at: editDeadline })"
  />
</template>

<script setup lang="ts">
  import QDatetimeInput from 'src/components/QDatetimeInput.vue'

  import type { Task } from 'src/stores/tasks/task-model'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { updateTask } from 'src/utils/task-utils'
  import { ref } from 'vue'

  const localSettings = useLocalSettingsStore()

  const task = defineModel<Task>('task', { required: true })

  const editDeadline = ref(task.value.deadline_at)
  console.log(editDeadline.value)
</script>
