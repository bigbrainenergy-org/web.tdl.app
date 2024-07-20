<template>
  <q-list class="text-primary" data-cy="task_list">
    <!-- If no tasks, render empty list item -->
    <q-item v-if="!tasks.length" v-ripple clickable data-cy="empty_list_message">
      <q-item-section>
        <strong>{{ props.emptyListMessage }}</strong>
      </q-item-section>
    </q-item>
    <!-- Otherwise, lazy render tasks -->
    <q-intersection v-for="(task, index) in tasks" :key="index" once style="min-height: 48px">
      <TaskItem :task="task" @task-clicked="$emit('task-clicked', $event, task.t)" />
    </q-intersection>
  </q-list>
</template>

<script setup lang="ts">
  import { toRef } from 'vue'
  import TaskItem from 'src/components/TaskItem.vue'
  import { cachedTask } from 'src/stores/performance/all-tasks'

  console.log('loaded task list')

  // TODO: unblockedOnly is unused, use it
  const props = withDefaults(
    defineProps<{
      tasks?: Array<cachedTask>
      unblockedOnly?: boolean
      incompleteOnly?: boolean
      emptyListMessage?: string
    }>(),
    {
      tasks: () => [], // Reasons I hate JavaScript++ (needs factory function on only specific types)
      unblockedOnly: false,
      incompleteOnly: false,
      emptyListMessage: 'Nothing yet!'
    }
  )

  defineEmits(['task-clicked', 'task-completion-toggled'])

  const tasks = toRef(props, 'tasks')
</script>
