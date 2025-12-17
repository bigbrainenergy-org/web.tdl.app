<template>
  <q-card
    :class="['task-card', { 'in-progress': isInProgress, 'completed': task.completed }]"
    @click="handleClick"
  >
    <q-card-section class="q-pa-sm">
      <div class="task-title">{{ task.title }}</div>
      <div v-if="showPrePostCount" class="task-meta">
        <span v-if="prereqCount > 0" class="prereq-count">{{ prereqCount }} pre</span>
        <span v-if="postreqCount > 0" class="postreq-count">{{ postreqCount }} post</span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { Task } from 'src/stores/tasks/task-model'

  const props = withDefaults(
    defineProps<{
      task: Task
      showPrePostCount?: boolean
    }>(),
    {
      showPrePostCount: false
    }
  )

  const emit = defineEmits<{
    click: [task: Task]
  }>()

  const isInProgress = computed(() => {
    return props.task.notes?.includes('!INPROGRESS') ?? false
  })

  const prereqCount = computed(() => {
    return props.task.hard_prereq_ids.length
  })

  const postreqCount = computed(() => {
    return props.task.hard_postreq_ids.length
  })

  const handleClick = () => {
    emit('click', props.task)
  }
</script>

<style scoped>
.task-card {
  width: 100%;
  min-width: 200px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid #424242;
  background-color: #1d1d1d;
}

.task-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.task-card.in-progress {
  border-color: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

.task-card.completed {
  opacity: 0.6;
  border-color: #003905;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
  word-wrap: break-word;
}

.task-meta {
  margin-top: 8px;
  font-size: 11px;
  color: #9e9e9e;
  display: flex;
  gap: 8px;
}

.prereq-count,
.postreq-count {
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
