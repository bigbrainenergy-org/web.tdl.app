<template>
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center">
          <div class="text-h6 col">{{ isEditing ? 'Edit Schedule' : 'Create Schedule' }}</div>
          <q-btn flat round icon="fas fa-times" @click="onDialogCancel" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-mb-md">
          <div class="col">
            <q-input v-model="title" filled label="Schedule Title" />
          </div>
          <div class="col-auto">
            <q-toggle v-model="isDefault" label="Default Schedule" />
          </div>
        </div>

        <div class="row q-gutter-md q-mb-md">
          <div class="col">
            <q-select
              v-model="copyFromSchedule"
              filled
              label="Copy from existing schedule"
              :options="existingSchedules"
              option-label="title"
              option-value="id"
              clearable
              emit-value
              map-options
              @update:model-value="copyBlocks"
            />
          </div>
          <div class="col-auto">
            <q-btn color="warning" label="Reset" icon="fas fa-undo" @click="resetAll" />
          </div>
        </div>
      </q-card-section>

      <q-card-section class="schedule-grid-container">
        <div
          class="schedule-grid"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
        >
          <!-- Header row -->
          <div class="grid-header grid-time-col" />
          <div
            v-for="day in DAYS_OF_WEEK"
            :key="day"
            class="grid-header"
          >
            {{ dayLabels[day] }}
          </div>

          <!-- Time rows -->
          <template v-for="slot in SLOT_COUNT" :key="slot - 1">
            <div class="grid-time-col grid-cell">
              <span v-if="(slot - 1) % 4 === 0" class="time-label">
                {{ formatSlotTime(slot - 1) }}
              </span>
            </div>
            <div
              v-for="day in DAYS_OF_WEEK"
              :key="`${day}-${slot - 1}`"
              class="grid-cell"
              :class="{
                selected: isSlotSelected(day, slot - 1),
                'hour-boundary': (slot - 1) % 4 === 0
              }"
              @mousedown.prevent="onMouseDown(day, slot - 1)"
              @mouseenter="onMouseEnter(day, slot - 1)"
            />
          </template>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat color="grey" label="Cancel" @click="onDialogCancel" />
        <q-btn
          color="primary"
          :label="isEditing ? 'Save' : 'Create'"
          :disable="!title.trim()"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent } from 'quasar'
  import { ref, reactive } from 'vue'
  import { useRepo } from 'pinia-orm'
  import {
    type DayOfWeek,
    type ScheduleBlock,
    DAYS_OF_WEEK,
    type Schedule,
    ScheduleRepo
  } from 'src/stores/schedules/schedule'
  import { handleError, notifySuccess } from 'src/utils/notification-utils'

  const SLOT_COUNT = 96 // 24 hours * 4 slots per hour

  const dayLabels: Record<DayOfWeek, string> = {
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat'
  }

  const props = defineProps<{
    schedule?: Schedule
  }>()

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

  const schedulesRepo = useRepo(ScheduleRepo)
  const existingSchedules = schedulesRepo.all()

  const isEditing = !!props.schedule
  const title = ref(props.schedule?.title ?? '')
  const isDefault = ref(props.schedule?.default ?? false)
  const copyFromSchedule = ref<number | null>(null)

  // Selection state: Map<day, Set<slotIndex>>
  const selected: Map<DayOfWeek, Set<number>> = reactive(new Map(
    DAYS_OF_WEEK.map((day) => [day, new Set<number>()])
  ))

  // Initialize from existing schedule blocks
  if (props.schedule) {
    loadBlocks(props.schedule.blocks)
  }

  // Drag state
  let isDragging = false

  function loadBlocks(blocks: ScheduleBlock[]) {
    // Clear all
    for (const day of DAYS_OF_WEEK) {
      selected.get(day)!.clear()
    }
    // Fill from blocks
    for (const block of blocks) {
      const startSlot = timeToSlot(block.start)
      const endSlot = timeToSlot(block.end)
      const daySet = selected.get(block.day_of_week)
      if (daySet) {
        for (let i = startSlot; i < endSlot; i++) {
          daySet.add(i)
        }
      }
    }
  }

  function copyBlocks(scheduleId: number | null) {
    if (scheduleId === null) return
    const schedule = schedulesRepo.find(scheduleId)
    if (schedule) {
      loadBlocks(schedule.blocks)
    }
  }

  function resetAll() {
    for (const day of DAYS_OF_WEEK) {
      selected.get(day)!.clear()
    }
  }

  function isSlotSelected(day: DayOfWeek, slot: number): boolean {
    return selected.get(day)?.has(slot) ?? false
  }

  function onMouseDown(day: DayOfWeek, slot: number) {
    isDragging = true
    // Toggle on click; during drag we only select (never deselect)
    const daySet = selected.get(day)!
    if (daySet.has(slot)) {
      daySet.delete(slot)
    } else {
      daySet.add(slot)
    }
  }

  function onMouseEnter(day: DayOfWeek, slot: number) {
    if (!isDragging) return
    // During drag, only select — never deselect
    selected.get(day)!.add(slot)
  }

  function onMouseUp() {
    isDragging = false
  }

  function formatSlotTime(slot: number): string {
    const hours = Math.floor(slot / 4)
    const minutes = (slot % 4) * 15
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  function timeToSlot(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return h! * 4 + Math.floor(m! / 15)
  }

  function slotsToBlocks(): ScheduleBlock[] {
    const blocks: ScheduleBlock[] = []
    for (const day of DAYS_OF_WEEK) {
      const daySet = selected.get(day)!
      if (daySet.size === 0) continue

      const sortedSlots = Array.from(daySet).sort((a, b) => a - b)

      let blockStart = sortedSlots[0]!
      let prev = blockStart

      for (let i = 1; i <= sortedSlots.length; i++) {
        const current = sortedSlots[i]
        if (current !== prev + 1 || i === sortedSlots.length) {
          // End of contiguous block
          blocks.push({
            day_of_week: day,
            start: formatSlotTime(blockStart),
            end: formatSlotTime(prev + 1)
          })
          if (i < sortedSlots.length) {
            blockStart = current!
          }
        }
        if (current !== undefined) prev = current
      }
    }
    return blocks
  }

  async function onSave() {
    const blocks = slotsToBlocks()

    if (isEditing && props.schedule) {
      await schedulesRepo
        .update({
          id: props.schedule.id,
          payload: {
            schedule: {
              title: title.value,
              default: isDefault.value,
              blocks
            }
          }
        })
        .then(() => {
          notifySuccess('Schedule updated')
        }, handleError('Error updating schedule'))
    } else {
      await schedulesRepo
        .add({
          title: title.value,
          default: isDefault.value,
          blocks
        })
        .then(() => {
          notifySuccess('Schedule created')
        }, handleError('Error creating schedule'))
    }

    emit('ok')
  }
</script>

<style scoped lang="scss">
  .schedule-grid-container {
    overflow: auto;
    max-height: calc(100vh - 300px);
  }

  .schedule-grid {
    display: grid;
    grid-template-columns: 60px repeat(7, 1fr);
    user-select: none;
    gap: 1px;
    background: $grey-8;
  }

  .grid-header {
    padding: 8px 4px;
    text-align: center;
    font-weight: bold;
    background: $dark;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .grid-time-col {
    background: $dark;
    padding: 0 4px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
  }

  .time-label {
    font-size: 0.7rem;
    color: $grey-5;
    transform: translateY(-6px);
  }

  .grid-cell {
    height: 12px;
    background: $dark-page;
    cursor: pointer;
    transition: background-color 0.05s;

    &.hour-boundary {
      border-top: 1px solid $grey-8;
    }

    &.selected {
      background: $primary;
    }

    &:hover:not(.selected) {
      background: rgba($primary, 0.3);
    }
  }
</style>
