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

<script setup lang="ts"></script>
