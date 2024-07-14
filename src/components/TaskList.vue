<template>
  <q-list ref="task_list" class="text-primary" data-cy="task_list">
    <!-- <p v-for="(task, index) in tasks" :key="index">{{ index }}</p> -->
    <q-intersection
      v-for="(task, index) in tasks"
      :key="index"
      once
      style="min-height: 48px"
      :root="list_root"
    >
      <TaskItem :task="task" />
      <!-- <p>{{ task.title }}</p> -->
    </q-intersection>
    <template v-if="props.tasks?.length === 0">
      <q-item v-ripple clickable data-cy="no_tasks_item">
        <q-item-section>
          <strong>Nothing yet!</strong>
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Task } from 'src/stores/tasks/task'
  import TaskItem from 'src/components/TaskItem.vue'

  console.log('loaded task list')

  // TODO: unblockedOnly is unused, use it
  const props = withDefaults(
    defineProps<{
      tasks?: Array<Task>
      unblockedOnly?: boolean
      incompleteOnly?: boolean
    }>(),
    {
      tasks: () => [], // Reasons I hate JavaScript++ (needs factory function)
      unblockedOnly: false,
      incompleteOnly: false
    }
  )

  defineEmits(['task-clicked', 'task-completion-toggled'])

  const tasks = ref(props.tasks)
  const task_list = ref(null)
  const list_root = computed(() => {
    return task_list.value?.$el
  })
</script>
