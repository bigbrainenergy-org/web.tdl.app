<template>
  <q-list ref="task_list" class="text-primary" data-cy="task_list">
    <!-- <p v-for="(task, index) in tasks" :key="index">{{ index }}</p> -->
    <q-intersection
      v-for="(task, index) in tasks"
      :key="index"
      once
      style="min-height: 48px"
      root="task_list"
    >
      <q-item v-ripple clickable @click="$emit('task-clicked', $event, task)">
        <q-checkbox
          v-model:model-value="task.completed"
          color="primary"
          keep-color
          @update:model-value="$emit('task-completion-toggled', $event, task)"
        />

        <q-item-section>
          <q-item-label lines="2">
            {{ task.title }}
          </q-item-label>
        </q-item-section>

        <q-item-section v-if="task.notes" side>
          <q-avatar icon="description">
            <q-tooltip anchor="center right" self="center left" :offset="[10, 10]">
              Has additional notes! Click to view.
            </q-tooltip>
          </q-avatar>
        </q-item-section>

        <q-item-section v-if="task.grabPostreqs(incompleteOnly).length" side>
          <q-chip
            v-if="task.grabPostreqs(incompleteOnly).length"
            :style="
              task.grabPostreqs(incompleteOnly).length > 5
                ? 'background-color: red;'
                : 'background-color: gray;'
            "
          >
            {{ task.grabPostreqs(incompleteOnly).length }}
          </q-chip>
        </q-item-section>
        <q-item-section side>
          <q-btn
            v-if="!task.completed"
            outline
            rounded
            label="ADD PRE"
            @click.stop="addTaskPre(task)"
          />
        </q-item-section>
      </q-item>
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
  import { ref } from 'vue'
  import { Task, TaskRepo } from 'src/stores/tasks/task'

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
</script>
