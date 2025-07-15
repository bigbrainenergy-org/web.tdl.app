<template>
  <TaskPage :tasks="tasks">
    <template #body="{ tasklist }">
      <TaskList
        :tasks="tasklist as Task[]"
        @task-completion-toggled="updateTask"
        @task-clicked="openTask"
      />
    </template>
  </TaskPage>
</template>

<script setup lang="ts">
  import TaskList from 'src/components/TaskList.vue'
  import TaskPage from 'src/components/TaskPage.vue'

  import { useMeta } from 'quasar'
  import { useTasks } from 'src/composables/use-tasks'
  import { considerOpeningQuickSortDialog, openUpdateTaskDialog } from 'src/utils/dialog-utils'
  import { playCheckboxSound } from 'src/utils/sound-utils'
  import type { Task } from 'src/stores/tasks/task-model'

  useMeta(() => ({ title: 'List | TDL App' }))

  const updateTask = async (_event: any, task: Task) => {
    playCheckboxSound(task.completed)
    await task.updateTaskCompletionStatus()
  }
  const openTask = (_event: any, task: Task) => openUpdateTaskDialog(task).onDismiss(considerOpeningQuickSortDialog)

  const { tasks } = useTasks()
</script>
