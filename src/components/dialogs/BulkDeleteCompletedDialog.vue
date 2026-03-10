<template>
  <q-dialog ref="dialogRef" :maximized="$q.screen.lt.md" @hide="onDialogHide">
    <q-card style="min-width: 450px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          Purge Completed Tasks
          <q-badge color="grey" :label="`${completedCount} remaining`" class="q-ml-sm" />
        </div>
        <q-space />
        <q-btn
          label="Confirm Delete"
          color="negative"
          :loading="deleting"
          class="q-mr-sm"
          :disable="!selectedTasks.length"
          @click="confirmDelete"
        />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator dark inset class="q-mt-sm" />

      <q-card-section v-if="!selectedTasks.length">
        <div class="text-center text-grey q-pa-lg">
          No completed tasks to purge.
        </div>
      </q-card-section>

      <q-list v-else separator>
        <q-item v-for="(task, index) in selectedTasks" :key="task.id">
          <q-item-section>
            <q-item-label>{{ task.title }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              round
              dense
              icon="fas fa-dice"
              :disable="deleting"
              @click="reroll(index)"
            >
              <q-tooltip>Re-roll</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useDialogPluginComponent } from 'quasar'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'

  const BATCH_SIZE = 20

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide } = useDialogPluginComponent()

  const taskStore = useTaskStore()
  const selectedTasks = ref<Task[]>([])
  const deleting = ref(false)

  const completedCount = computed(() => taskStore.array.filter((t: Task) => t.completed).length)

  function getCompletedPool(exclude: Set<number>): Task[] {
    return taskStore.array.filter((t: Task) => t.completed && !exclude.has(t.id))
  }

  function pickRandom(arr: Task[], count: number): Task[] {
    const shuffled: Task[] = arr.slice()
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = shuffled[i]!
      shuffled[i] = shuffled[j]!
      shuffled[j] = tmp
    }
    return shuffled.slice(0, count)
  }

  function loadBatch() {
    selectedTasks.value = pickRandom(getCompletedPool(new Set()), BATCH_SIZE)
  }

  function reroll(index: number) {
    const currentIds = new Set(selectedTasks.value.map(t => t.id))
    const pool = getCompletedPool(currentIds)
    if (!pool.length) return
    const replacement = pool[Math.floor(Math.random() * pool.length)]!
    selectedTasks.value[index] = replacement
  }

  async function confirmDelete() {
    if (!selectedTasks.value.length) return
    deleting.value = true
    try {
      await taskStore.apiBulkDelete(selectedTasks.value.map(t => t.id))
      loadBatch()
    } finally {
      deleting.value = false
    }
  }

  loadBatch()
</script>
