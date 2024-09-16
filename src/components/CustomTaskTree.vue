<script setup lang="ts">
  import { T2 } from 'src/stores/t2/t2-model'
  import TaskTreeItem from './TaskTreeItem.vue'

  const props = defineProps<{ tasks: T2[] }>()
</script>

<template>
  <ul style="list-style-type: none">
    <li v-for="task in tasks" :key="task.id ?? -1" class="text-white">
      <task-tree-item :task="task" />
    </li>
  </ul>
</template>
