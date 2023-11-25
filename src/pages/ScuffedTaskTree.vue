<template>
  <CustomTaskTree :tasks="layerZeroTasks" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CustomTaskTree from 'src/components/CustomTaskTree.vue'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { useRepo } from 'pinia-orm'

const tr = useRepo(TaskRepo)

const layerZeroTasks = computed(() => tr.where((x: Task) => x.hard_prereq_ids.length === 0).get())
</script>