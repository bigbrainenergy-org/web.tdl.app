<template>
  <q-list class="text-primary" data-cy="task_list">
    <template v-if="loading">
      <q-item v-for="index in 5" :key="index" v-ripple>
        <q-skeleton type="QRadio" class="q-mr-md" />
        <q-item-section>
          <q-skeleton type="text" />
        </q-item-section>

        <q-item-section v-if="$q.screen.gt.sm" side>
          <q-skeleton type="QRadio" />
        </q-item-section>

        <q-item-section v-if="$q.screen.gt.sm" side>
          <q-skeleton type="QChip" />
        </q-item-section>

        <q-item-section v-if="$q.screen.gt.sm" side>
          <q-skeleton type="QBtn" />
        </q-item-section>
      </q-item>
      <q-inner-loading
        :showing="loading"
        label="Loading..."
        label-class="text-teal"
        label-style="font-size: 1.1em"
      />
    </template>
    <template v-else>
      <!-- If no tasks, render empty list item -->
      <q-item v-if="!tasks.length" v-ripple clickable data-cy="empty_list_message">
        <q-item-section>
          <!-- FIXME: useLoadingStateStore appears to cause not insignificant loading lag, disabling for now
               Also, we should probably use:
               https://quasar.dev/vue-components/inner-loading
               https://quasar.dev/vue-components/skeleton
          -->
          <strong>{{ props.emptyListMessage }}</strong>
        </q-item-section>
      </q-item>
      <!-- Otherwise, lazy render tasks -->
      <q-intersection v-for="(task, index) in tasks.slice(undefined, 200)" :key="index" once style="min-height: 48px">
        <TaskItem
          :task="task"
          @task-clicked="$emit('task-clicked', $event, task)"
          @task-completion-toggled="$emit('task-completion-toggled', $event, task)"
        />
      </q-intersection>
    </template>
  </q-list>
</template>

<script setup lang="ts">
  import TaskItem from 'src/components/TaskItem.vue'

  import { computed } from 'vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import type { Task } from 'src/stores/tasks/task-model'
  import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
  import { useTaskStore } from 'src/stores/tasks/task-store'

  // TODO: unblockedOnly is unused, use it
  const props = withDefaults(
    defineProps<{
      tasks?: Array<Task>
      unblockedOnly?: boolean
      incompleteOnly?: boolean
      emptyListMessage?: string
    }>(),
    {
      tasks: () => [],
      emptyListMessage: 'Nothing yet!'
    }
  )

  //console.debug('loaded task list')
  //console.debug({ tasks: props.tasks })

  defineEmits(['task-clicked', 'task-completion-toggled'])

  // commenting this out for now - is this different from defineModel somehow? is this necessary? is this useful? TODO
  // const tasks = toRef(props, 'tasks')

  const loading = computed(() => useLoadingStateStore().busy)
  //console.log(useTaskStarredStore()._starredIds.map(id => useTaskStore().mapp.get(id)?.title))
</script>
