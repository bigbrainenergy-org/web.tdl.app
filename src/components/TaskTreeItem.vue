<script setup lang="ts">
import { useRepo } from 'pinia-orm'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { ref } from 'vue'

const props = defineProps<{ task: Task }>()
const task = ref(props.task)

const tr = useRepo(TaskRepo)

const loadChildren = (t: Task) => {
  console.log('loadChildren')
  t.expanded = true
  if(t.hard_postreq_ids.length > 1) {
    tr.with('hard_postreqs').load([t])
  }
}
</script>

<template>
  <q-item>
    <q-btn @click="loadChildren(task)" icon="fa-solid fa-square-caret-right" v-if="task.expanded == false && task.hard_postreq_ids.length > 0" style="height: 20px;"/>
    <q-btn @click="() => task.expanded = false" icon="fa-solid fa-square-caret-down" v-if="task.expanded" style="height: 20px;"/>
    {{ task.title }}
    <ul v-if="task.expanded" style="list-style-type: none">
      <li v-for="post in task.hard_postreqs" :key="post.id ?? -1">
        <task-tree-item :task="post"></task-tree-item>
      </li>
    </ul>
  </q-item>
</template>