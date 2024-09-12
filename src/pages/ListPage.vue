<template>
  <TaskPage :tasks="tasks">
    <TaskList :tasks="tasks" @task-completion-toggled="updateTask" @task-clicked="openTask" />
  </TaskPage>
</template>

<script setup lang="ts">
  import TaskList from 'src/components/TaskList.vue'
  import TaskPage from 'src/components/TaskPage.vue'

  import { useMeta } from 'quasar'
  import { Task } from 'src/stores/tasks/task'
  import { useTasks } from 'src/composables/use-tasks'
  import { updateTaskCompletedStatus } from 'src/utils/task-utils'
  import { openUpdateTaskDialog } from 'src/utils/dialog-utils'
  import { playCheckboxSound } from 'src/utils/sound-utils'

  useMeta(() => ({ title: 'List | TDL App' }))

  const updateTask = (_event: any, task: Task) => {
    playCheckboxSound(task.completed)
    updateTaskCompletedStatus(task)
  }
  const openTask = (_event: any, task: Task) => openUpdateTaskDialog(task)

  const { tasks } = useTasks()
</script>
