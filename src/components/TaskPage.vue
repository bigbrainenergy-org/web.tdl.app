<template>
  <FullPage>
    <TransparentCard>
      <template #actions>
        <TaskListActions :tasks="tasks" />
      </template>

      <template #header>
        <PainHeader data-cy="tasks_title">Tasks</PainHeader>
      </template>

      <template #body>
        <slot></slot>
      </template>
    </TransparentCard>
  </FullPage>
</template>

<script setup lang="ts">
  import FullPage from 'src/components/FullPage.vue'
  import TransparentCard from 'src/components/TransparentCard.vue'
  import TaskListActions from 'src/components/TaskListActions.vue'
  import PainHeader from 'src/components/PainHeader.vue'
  import { cachedTask } from 'src/stores/performance/all-tasks';

  const tasks = defineModel<Array<cachedTask>>('tasks', { required: true })
</script>
