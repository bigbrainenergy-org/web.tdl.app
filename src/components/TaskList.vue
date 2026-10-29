<template>
  <q-list class="text-primary" data-cy="task_list">
    <template v-if="loading">
      <q-item v-for="index in 20" :key="index" v-ripple>
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
      <!-- Virtual scroll for smooth rendering of large lists -->
      <q-virtual-scroll
        v-else
        v-slot="{ item }"
        :items="tasksWithMetadata"
        :virtual-scroll-item-size="56"
        :virtual-scroll-slice-size="40"
        style="height: calc(100vh - 200px); min-height: 400px"
      >
        <TaskItem
          v-bind="item"
          show-actions
          show-refinement-icon
          @task-clicked="$emit('task-clicked', $event, item.task)"
          @task-completion-toggled="$emit('task-completion-toggled', $event, item.task)"
        />
      </q-virtual-scroll>
    </template>
  </q-list>
</template>

<script setup lang="ts">
  import TaskItem from 'src/components/TaskItem.vue'

  import { computed, nextTick, toRef, watch } from 'vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import type { Task } from 'src/stores/tasks/task-model'
  import { useTaskMetadata } from 'src/composables/use-task-metadata'

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

  defineEmits(['task-clicked', 'task-completion-toggled'])

  // Wrap props.tasks as a ref for the composable
  const tasks = toRef(props, 'tasks')

  // Compute metadata once for all tasks, then v-bind to TaskItem
  const { computeMetadataForTasks } = useTaskMetadata()
  let tasksWithMetadata = Object.freeze(computeMetadataForTasks(tasks).value)
  watch(tasks, () => {
    tasksWithMetadata = Object.freeze(computeMetadataForTasks(tasks).value)
  })

  const loading = computed(() => useLoadingStateStore().busy)
</script>
