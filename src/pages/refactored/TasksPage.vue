<template>
  <TaskPage :tasks="tasks">
    <TaskList
      :tasks="tasks"
      :unblocked-only="layerZeroOnly"
      :incomplete-only="hideCompleted"
      @task-completion-toggled="updateTaskCompletedStatus"
      @task-clicked="openTask"
    />
  </TaskPage>
</template>

<script setup lang="ts"></script>
