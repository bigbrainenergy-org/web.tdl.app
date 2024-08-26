<template>
  <ul style="list-style-type: none">
    <li v-for="task in tasks" :key="task.id ?? -1" class="text-white">
      <task-tree-item :task="task" />
    </li>
  </ul>
</template>

<script setup lang="ts">
  import { Task } from 'src/stores/tasks/task'
  import TaskTreeItem from './TaskTreeItem.vue'

  const props = defineProps<{ tasks: Task[] }>()
</script>
