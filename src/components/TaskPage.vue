<template>
  <FullPage>
    <TransparentCard>
      <template #actions>
        <TaskListActions v-model:filtered="filteredTasks as Task[]" :tasks="tasks" />
      </template>

      <template #header>
        <PainHeader data-cy="tasks_title">Tasks</PainHeader>
      </template>

      <template #body>
        <slot name="body" :tasklist="filteredTasks"><q-icon size="8rem" name="fa-solid fa-dumpster-fire" /><q-btn class="text-primary">{{ filteredTasks.length }}</q-btn></slot>
      </template>
    </TransparentCard>
  </FullPage>
</template>

<script setup lang="ts">
  import FullPage from 'src/components/FullPage.vue'
  import TransparentCard from 'src/components/TransparentCard.vue'
  import TaskListActions from 'src/components/TaskListActions.vue'
  import PainHeader from 'src/components/PainHeader.vue'

  import type { Task } from 'src/stores/tasks/task-model'
  import { ref } from 'vue'

  // TODO: This should probably be a layout instead

  const tasks = defineModel<Array<Task>>('tasks', { required: true })
  const filteredTasks = ref<Task[]>([])
</script>
