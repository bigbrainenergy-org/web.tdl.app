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
  import { dogFoodHarder } from 'src/stores/tasks/dogfood'
  import { useTaskStore } from 'src/stores/tasks/task-store'

  useMeta(() => ({ title: 'List | TDL App' }))

  const updateTask = async (_event: any, task: Task) => {
    dogFoodHarder().taskLength = useTaskStore().allTasks.length
    playCheckboxSound(task.completed)
    await task.updateTaskCompletionStatus()
      .then(() => dogFoodHarder().assertTaskLength('task-completion-toggled'))
  }
  const openTask = (_event: any, task: Task) => openUpdateTaskDialog(task).onDismiss(considerOpeningQuickSortDialog)

  // BUG sometimes especially after adding deps or marking a task complete, the tasks returned here is not all of the tasks.
  const { tasks } = useTasks()
</script>
