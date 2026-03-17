<template>
  <q-page class="q-pa-lg">
    <div class="row q-gutter-md items-start">
      <!-- Left panel: Scheduled tasks -->
      <div class="col">
        <q-card style="background-color: #1d1d1df6">
          <q-card-actions>
            <q-btn
              color="primary"
              icon="fa-solid fa-calendar-check"
              label="Auto-Schedule"
              :loading="isComputing"
              @click="compute"
            />
            <q-space />
            <q-item-label v-if="result" class="text-primary">
              {{ result.scheduled.length }} scheduled
            </q-item-label>
            <q-btn flat icon="settings" class="text-primary" @click="openScheduleManagerDialog" />
          </q-card-actions>

          <q-card-section v-if="!result" class="text-grey-5 text-center q-pa-xl">
            Click "Auto-Schedule" to generate a schedule.
          </q-card-section>

          <q-card-section v-else class="q-pa-none">
            <q-virtual-scroll
              :items="displayItems"
              :virtual-scroll-item-size="40"
              style="max-height: calc(100vh - 200px)"
              v-slot="{ item }"
            >
              <!-- Day separator -->
              <div
                v-if="item.type === 'separator'"
                :key="'sep-' + item.label"
                class="q-pa-sm text-bold text-grey-4 bg-dark"
                style="border-bottom: 1px solid #444"
              >
                {{ item.label }}
              </div>

              <!-- Task card -->
              <div
                v-else
                :key="'task-' + item.scheduled.task.id"
                class="scheduled-card q-pa-xs"
                :style="{ height: cardHeight(item.scheduled.durationMinutes) + 'px', minHeight: '40px' }"
                @click="openTask(item.scheduled.task)"
              >
                <div class="row items-center full-height no-wrap">
                  <q-checkbox
                    :model-value="item.scheduled.task.completed"
                    color="primary"
                    keep-color
                    dense
                    class="q-mr-xs"
                    @update:model-value="() => item.scheduled.task.updateTaskCompletionStatus()"
                    @click.stop
                  />
                  <span class="text-grey-5 text-caption q-mr-sm" style="min-width: 90px">
                    {{ formatTime(item.scheduled.startTime) }}–{{ formatTime(item.scheduled.endTime) }}
                  </span>
                  <span class="text-primary ellipsis">
                    {{ item.scheduled.task.title }}
                  </span>
                  <q-badge class="q-ml-sm" color="grey-7" text-color="white">
                    {{ item.scheduled.scheduleTitle }}
                  </q-badge>
                </div>
              </div>
            </q-virtual-scroll>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right panel: At-risk tasks -->
      <div class="col-4">
        <q-card style="background-color: #1d1d1df6">
          <q-card-section class="bg-negative text-white">
            <div class="row items-center">
              <div class="col text-h6">
                At Risk
                <q-badge v-if="result" color="white" text-color="negative" class="q-ml-sm">
                  {{ result.atRisk.length }}
                </q-badge>
              </div>
            </div>
          </q-card-section>

          <q-card-section v-if="!result" class="text-grey-5 text-center">
            No schedule computed yet.
          </q-card-section>

          <q-card-section v-else-if="result.atRisk.length === 0" class="text-green text-center">
            All tasks fit within their deadlines.
          </q-card-section>

          <q-list v-else>
            <q-item
              v-for="item in result.atRisk"
              :key="item.task.id"
              v-ripple
              clickable
              @click="openTask(item.task)"
            >
              <q-item-section>
                <q-item-label>{{ item.task.title }}</q-item-label>
                <q-item-label caption class="text-negative">
                  {{ item.reason }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption class="text-grey-5">
                  Due {{ formatDate(item.deadline) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useMeta } from 'quasar'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { runAutoScheduler, type AutoScheduleResult, type ScheduledItem } from 'src/composables/use-auto-scheduler'
  import { openUpdateTaskDialog, openScheduleManagerDialog } from 'src/utils/dialog-utils'
  import type { Task } from 'src/stores/tasks/task-model'

  useMeta({ title: 'Schedule' })

  type DisplayItem =
    | { type: 'separator'; label: string }
    | { type: 'task'; scheduled: ScheduledItem; startTime: Date; endTime: Date }

  const result = ref<AutoScheduleResult | null>(null)
  const isComputing = ref(false)

  const displayItems = computed<DisplayItem[]>(() => {
    if (!result.value) return []
    const items: DisplayItem[] = []
    let lastDateStr = ''

    for (const s of result.value.scheduled) {
      const dateStr = s.startTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })
      if (dateStr !== lastDateStr) {
        items.push({ type: 'separator', label: dateStr })
        lastDateStr = dateStr
      }
      items.push({ type: 'task', scheduled: s, startTime: s.startTime, endTime: s.endTime })
    }
    return items
  })

  function compute() {
    isComputing.value = true
    setTimeout(() => {
      const taskStore = useTaskStore()
      const tasks = taskStore.incompleteOnly.value
      result.value = runAutoScheduler(tasks)
      isComputing.value = false
    }, 0)
  }

  function openTask(task: Task) {
    openUpdateTaskDialog(task)
  }

  function cardHeight(durationMinutes: number): number {
    return Math.ceil(durationMinutes / 10) * 20
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
</script>

<style scoped lang="scss">
  .scheduled-card {
    border-bottom: 1px solid #333;
    cursor: pointer;
    transition: background-color 0.1s;
    padding-left: 8px;
    padding-right: 8px;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
</style>
