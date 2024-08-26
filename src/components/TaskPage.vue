<template>
  <full-page>
    <transparent-card>
      <template #actions>
        <task-list-actions :tasks="tasks" />
      </template>

      <template #header>
        <pain-header data-cy="tasks_title">Tasks</pain-header>
      </template>

      <template #body>
        <slot></slot>
      </template>
    </transparent-card>
  </full-page>
</template>

<script setup lang="ts">
  import FullPage from 'src/components/FullPage.vue'
  import TransparentCard from 'src/components/TransparentCard.vue'
  import TaskListActions from 'src/components/TaskListActions.vue'
</script>
