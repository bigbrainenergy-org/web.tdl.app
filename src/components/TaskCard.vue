<template>
  <q-card
    :class="cardClass"
    @click="handleClick"
  >
    <q-card-section class="q-pa-sm">
      <div class="task-title">{{ task.title }}</div>

      <!-- Prerequisites with checkboxes -->
      <div v-if="showPrerequisites && allIncompletePrereqs.length > 0" class="prereqs-section" @click.stop>
        <div class="prereqs-header text-primary">Prerequisites ({{ allIncompletePrereqs.length }}):</div>
        <div
          v-for="prereqInfo in visiblePrereqs"
          :key="prereqInfo.prereq.id"
          class="prereq-item"
          :class="{ 'prereq-item-clickable': true }"
          @click.stop="onPrereqClick(prereqInfo.prereq)"
        >
          <q-checkbox
            :model-value="prereqInfo.prereq.completed"
            dense
            size="xs"
            color="primary"
            @click.stop
            @update:model-value="togglePrereqComplete(prereqInfo.prereq)"
          />
          <span
            :class="['prereq-title', prereqInfo.isBlocked ? 'text-grey-5' : 'text-primary']"
          >
            {{ prereqInfo.prereq.title }}
          </span>
          <q-icon
            v-if="prereqInfo.isBlocked"
            name="lock"
            color="grey-9"
            class="blocked-icon"
          >
            <q-tooltip>This task is blocked by other prerequisites</q-tooltip>
          </q-icon>
        </div>
        <q-btn
          v-if="allIncompletePrereqs.length > 3"
          flat
          dense
          no-caps
          size="sm"
          :label="showAllPrereqs ? 'Show less' : `Show ${allIncompletePrereqs.length - 3} more`"
          class="text-primary show-more-btn"
          @click.stop="showAllPrereqs = !showAllPrereqs"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { Task, TaskDepRef } from 'src/stores/tasks/task-model'
  import { useTaskStore } from 'src/stores/tasks/task-store'

  const props = withDefaults(
    defineProps<{
      task: Task
      showPrePostCount?: boolean
      showPrerequisites?: boolean
    }>(),
    {
      showPrePostCount: false,
      showPrerequisites: false
    }
  )

  const emit = defineEmits<{
    click: [task: Task]
    prereqClick: [task: Task]
  }>()

  const taskStore = useTaskStore()
  const showAllPrereqs = ref(false)

  const isInProgress = computed(() => {
    return props.task.notes?.includes('!INPROGRESS') ?? false
  })

  const fitsAllWeirdCriteria = (tdr: TaskDepRef) => {
    if (tdr.task.completed) return false
    if (tdr.degree ?? 2 < 2) return false
    if (tdr.task.notes?.includes('!PROJECT') ?? false) return false
  }

  // Get all incomplete prerequisites (excluding those that are also projects)
  const allIncompletePrereqs = computed(() => {
    return props.task.pres.filter(fitsAllWeirdCriteria)
  })

  // Map prerequisites with blocked status
  interface PrereqInfo {
    prereq: Task
    isBlocked: boolean
  }

  // BFS through prerequisites hierarchy to find optimal tasks to display
  const prereqsWithBlockedStatus = computed(() => {
    if (allIncompletePrereqs.value.length === 0) return []

    interface PrereqWithDepth {
      prereq: Task
      isBlocked: boolean
      depth: number
    }

    const visited = new Set<number>()
    const queue: { task: Task; depth: number }[] = []
    const unblockedTasks: PrereqWithDepth[] = []
    const blockedTasks: PrereqWithDepth[] = []

    // Initialize queue with direct prerequisites
    allIncompletePrereqs.value.forEach(prereq => {
      if (!visited.has(prereq.task.id)) {
        queue.push({ task: prereq.task, depth: 1 })
        visited.add(prereq.task.id)
      }
    })

    // BFS traversal
    while (queue.length > 0) {
      const { task, depth } = queue.shift()!
      const taskPrereqs = task.pres.filter(fitsAllWeirdCriteria)
      const isBlocked = taskPrereqs.length > 0

      const prereqInfo: PrereqWithDepth = {
        prereq: task,
        isBlocked,
        depth
      }

      if (isBlocked) {
        blockedTasks.push(prereqInfo)
        // Continue BFS through this task's prerequisites
        taskPrereqs.forEach(prereq => {
          if (!visited.has(prereq.task.id)) {
            queue.push({ task: prereq.task, depth: depth + 1 })
            visited.add(prereq.task.id)
          }
        })
      } else {
        unblockedTasks.push(prereqInfo)
      }
    }

    // Selection logic:
    // 1. Try to get 3 unblocked tasks
    // 2. If less than 3 unblocked, get farthest-up blocked tasks to fill
    // 3. Special case: if exactly 2 unblocked, show those + 1 blocked

    const result: PrereqInfo[] = []

    // Sort blocked tasks by depth (descending) to get farthest-up first
    blockedTasks.sort((a, b) => b.depth - a.depth)

    if (unblockedTasks.length >= 3) {
      // Take first 3 unblocked
      result.push(...unblockedTasks.slice(0, 3))
    } else if (unblockedTasks.length === 2) {
      // Take 2 unblocked + 1 blocked (if available)
      result.push(...unblockedTasks)
      if (blockedTasks.length > 0 && blockedTasks[0]) {
        result.push(blockedTasks[0])
      }
    } else {
      // Take all unblocked + fill with farthest-up blocked to make 3
      result.push(...unblockedTasks)
      const remainingSlots = 3 - unblockedTasks.length
      result.push(...blockedTasks.slice(0, remainingSlots))
    }

    return result
  })

  const visiblePrereqs = computed(() =>
    showAllPrereqs.value ? prereqsWithBlockedStatus.value : prereqsWithBlockedStatus.value.slice(0, 3)
  )

  const togglePrereqComplete = async (prereq: Task) => {
    await taskStore.apiUpdate(prereq.id, { completed: !prereq.completed })
  }

  const onPrereqClick = (prereq: Task) => {
    emit('prereqClick', prereq)
  }

  const handleClick = () => {
    emit('click', props.task)
  }

  const cardClass = computed(() => {
    const r = (x: Record<string, boolean>) => ['task-card', x]
    const subclass: Record<string, boolean> = {}
    if(props.task.completed) {
      subclass['completed'] = true
      return r(subclass)
    }
    const project_postreqs = props.task.grabPostreqs(true).filter(x => x.notes?.includes('!PROJECT')).length
    if(props.task.notes?.includes('!REFINE') || props.task.grabPrereqs(true).filter(x => !x.notes?.includes('!PROJECT')).length === 0 || project_postreqs === 0 || project_postreqs > 4) {
      subclass['needs-refinement'] = true
      return r(subclass)
    }
    if(props.task.notes?.includes('!INPROGRESS') ?? false) {
      subclass['in-progress'] = true
      return r(subclass)
    }
    else return ['task-card']
  })
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

.task-card.needs-refinement {
  border-color: #ffaa00;
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

.prereqs-section {
  margin-top: 12px;
  font-size: 12px;
}

.prereqs-header {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
}

.prereq-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.prereq-item-clickable {
  cursor: pointer;
}

.prereq-item-clickable:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.prereq-title {
  flex: 1;
  font-size: 11px;
  line-height: 1.3;
  word-break: break-word;
}

.blocked-icon {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 12px;
}

.show-more-btn {
  margin-top: 2px;
  margin-left: 4px;
  padding: 0;
  min-height: auto;
  font-size: 11px;
}
</style>
