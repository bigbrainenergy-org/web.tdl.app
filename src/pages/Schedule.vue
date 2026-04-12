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
            <q-btn flat label="Schedules" class="text-primary" @click="openScheduleManagerDialog" />
            <GloriousSettingsPopup>
              <GloriousSlider v-model="scheduleDisplayLimit" cute-name="Display Limit" :min="200" :max="4000" :step="200" />
              <GloriousSlider v-model="schedulerStarMod" cute-name="Star" unit="x" :min="0" :max="2" :step="0.5" color="amber" />
              <GloriousSlider v-model="schedulerProjectMod" cute-name="Project" unit="x" :min="0" :max="2" :step="0.5" color="blue" />
              <GloriousSlider v-model="schedulerInProgressMod" cute-name="In Progress" unit="x" :min="0" :max="2" :step="0.5" color="green" />
              <GloriousSlider v-model="schedulerDueDateMod" cute-name="Due Date" unit="x" :min="0" :max="2" :step="0.5" color="orange" />
              <GloriousSlider v-model="schedulerScheduleMod" cute-name="Schedule" unit="x" :min="0" :max="2" :step="0.5" color="cyan" />
              <GloriousSlider v-model="schedulerProcedureMod" cute-name="Procedure" unit="x" :min="0" :max="2" :step="0.5" color="purple" />
            </GloriousSettingsPopup>
          </q-card-actions>

          <q-card-section v-if="!result" class="text-grey-5 text-center q-pa-xl">
            Click "Auto-Schedule" to generate a schedule.
          </q-card-section>

          <q-card-section v-else class="q-pa-none" style="max-height: calc(100vh - 200px); overflow-y: auto">
            <q-list>
              <template v-for="item in displayItems" :key="item.type === 'separator' ? 'sep-' + item.label : 'task-' + item.scheduled.task.id">
                <!-- Day separator -->
                <div
                  v-if="item.type === 'separator'"
                  class="q-pa-sm text-bold text-grey-4 bg-dark"
                  style="border-bottom: 1px solid #444"
                >
                  {{ item.label }}
                </div>

                <!-- Task item -->
                <q-item
                  v-else
                  v-ripple
                  clickable
                  class="scheduled-card"
                  :class="{
                    'completed-task': isCompleted(item.scheduled.task),
                    'scheduled-card--bordered': hasBreaks
                  }"
                  :style="{ minHeight: cardHeight(item.scheduled.durationMinutes) + 'px', marginBottom: hasBreaks ? breakGapPx + 'px' : undefined }"
                  @click="openTask(item.scheduled.task)"
                >
                  <q-checkbox
                    :model-value="isCompleted(item.scheduled.task)"
                    color="primary"
                    keep-color
                    dense
                    class="q-mr-xs"
                    @update:model-value="() => toggleCompletion(item.scheduled.task)"
                    @click.stop
                  />
                  <q-item-section>
                    <q-item-label>
                      <span class="text-grey-5 text-caption q-mr-sm">
                        {{ formatTime(item.scheduled.startTime) }}–{{ formatTime(item.scheduled.endTime) }}
                      </span>
                      <span class="text-primary">
                        {{ item.scheduled.task.title }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="grey-7" text-color="white">
                      {{ item.scheduled.scheduleTitle }}
                    </q-badge>
                  </q-item-section>
                  <q-item-section v-if="getBreakdown(item.scheduled.task.id)" side>
                    <q-badge color="deep-purple-9" text-color="white">
                      {{ Math.round(getBreakdown(item.scheduled.task.id)!.total) }}
                      <q-tooltip>
                        <div style="white-space: pre; font-family: monospace; font-size: 12px">{{ formatBreakdown(getBreakdown(item.scheduled.task.id)!) }}</div>
                      </q-tooltip>
                    </q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
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
              @click="openTask(item.task as Task)"
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
                <TaskPuntChip :task="item.task as Task" />
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
  import { storeToRefs } from 'pinia'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { runAutoScheduler, type AutoScheduleResult, type ScheduledItem, type PriorityBreakdown } from 'src/composables/use-auto-scheduler'
  import { openUpdateTaskDialog, openScheduleManagerDialog } from 'src/utils/dialog-utils'
  import type { Task } from 'src/stores/tasks/task-model'
  import GloriousSettingsPopup from 'src/components/glorious/GloriousSettingsPopup.vue'
  import GloriousSlider from 'src/components/glorious/GloriousSlider.vue'
  import TaskPuntChip from 'src/components/TaskPuntChip.vue'

  useMeta({ title: 'Schedule' })

  const localSettings = useLocalSettingsStore()
  const {
    scheduleDisplayLimit,
    schedulerStarMod,
    schedulerProjectMod,
    schedulerInProgressMod,
    schedulerDueDateMod,
    schedulerScheduleMod,
    schedulerProcedureMod
  } = storeToRefs(localSettings)

  type DisplayItem =
    | { type: 'separator'; label: string }
    | { type: 'task'; scheduled: ScheduledItem; startTime: Date; endTime: Date }

  const result = ref<AutoScheduleResult | null>(null)
  const isComputing = ref(false)
  const completedIds = ref(new Set<number>())

  function isCompleted(task: Task): boolean {
    return completedIds.value.has(task.id) || task.completed
  }

  async function toggleCompletion(task: Task) {
    const taskStore = useTaskStore()
    const liveTask = taskStore.mapp.get(task.id)
    if (!liveTask) return

    liveTask.completed = !liveTask.completed
    task.completed = liveTask.completed

    if (liveTask.completed) {
      completedIds.value.add(task.id)
    } else {
      completedIds.value.delete(task.id)
    }

    await liveTask.updateTaskCompletionStatus()
  }

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
      const scheduled = s as ScheduledItem
      items.push({ type: 'task', scheduled, startTime: s.startTime, endTime: s.endTime })
    }
    return items
  })

  function compute() {
    isComputing.value = true
    setTimeout(() => {
      const taskStore = useTaskStore()
      const tasks = taskStore.incompleteOnly.value
      const fullResult = runAutoScheduler(tasks)
      fullResult.scheduled = fullResult.scheduled.slice(0, scheduleDisplayLimit.value)
      result.value = fullResult
      isComputing.value = false
    }, 0)
  }

  function openTask(task: Task) {
    openUpdateTaskDialog(task)
  }

  const hasBreaks = computed(() => localSettings.taskBreaksBetween > 0)

  const breakGapPx = computed(() => {
    return Math.ceil(localSettings.taskBreaksBetween / 5) * 10
  })

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

  function getBreakdown(taskId: number) {
    return (result.value?.breakdowns as Map<number, PriorityBreakdown>).get(taskId)
  }

  function formatBreakdown(b: PriorityBreakdown): string {
    const lines = [
      `Layer:       ${b.layerWeight}`,
      `Star:        ${b.starWeight}`,
      `Project:     ${b.projectLayerWeight}`,
      `In Progress: ${b.inProgressBonus}`,
      `Due Date:    ${Math.round(b.dueDateBonus * 10) / 10}`,
      `Schedule:    ${b.scheduleBonus}`,
      `Procedure:   ${b.procedureBonus}`,
      '─────────────────',
      `Total:       ${Math.round(b.total)}`
    ]
    return lines.join('\n')
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
    transition: background-color 0.1s, opacity 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }

    &.completed-task {
      opacity: 0.4;

      .text-primary {
        text-decoration: line-through;
      }
    }

    &--bordered {
      border-bottom: none;
      border: 1px solid #333;
      border-radius: 6px;
    }
  }
</style>
