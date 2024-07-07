<script setup lang="ts">
  import { useRepo } from 'pinia-orm'
  import { Task, TaskRepo } from 'src/stores/tasks/task'
  import { ref } from 'vue'

  const props = defineProps<{ task: Task }>()
  const task = ref(props.task)

  const tr = useRepo(TaskRepo)

  const loadChildren = (t: Task) => {
    console.log('loadChildren')
    t.expanded_state.expanded = true
    if (t.hard_postreq_ids.length > 1) {
      tr.with('hard_postreqs').load([t])
    }
  }
</script>

<template>
  <q-item>
    <q-btn
      v-if="task.expanded_state.expanded === false && task.hard_postreq_ids.length > 0"
      icon="fa-solid fa-square-caret-right"
      style="height: 20px"
      @click="loadChildren(task as Task)"
    />
    <q-btn
      v-if="task.expanded_state.expanded"
      icon="fa-solid fa-square-caret-down"
      style="height: 20px"
      @click="() => (task.expanded_state.expanded = false)"
    />
    {{ task.title }}
    <ul v-if="task.expanded_state.expanded" style="list-style-type: none">
      <li v-for="post in task.hard_postreqs" :key="post.id ?? -1">
        <task-tree-item :task="post as Task" />
      </li>
    </ul>
  </q-item>
</template>
expanded_stateQItemQItemexpanded_stateQBtnexpanded_stateQBtnexpanded_stateTaskTreeItemTaskTreeItem