<template>
  <q-select
    v-model="selectedSchedule"
    filled
    hide-selected
    fill-input
    input-debounce="20"
    :options="scheduleOptions"
    use-chips
    option-label="title"
    map-options
    emit-value
    label="Schedule"
    use-input
    option-value="id"
    clearable
    class="q-my-md text-primary"
    @filter="filterSelection"
    @update:model-value="updateSchedule"
  />
</template>

<script setup lang="ts">
  import { useRepo } from 'pinia-orm'
  import type { Task } from 'src/stores/tasks/task-model'
  import { updateTask } from 'src/utils/task-utils'
  import { ref } from 'vue'
  import { ScheduleRepo } from 'src/stores/schedules/schedule'

  const task = defineModel<Task>('task', { required: true })

  const schedulesRepo = useRepo(ScheduleRepo)
  const allSchedules = schedulesRepo.all()
  const scheduleOptions = ref(allSchedules)

  function getSelectedSchedule(task: Task) {
    if (!task.schedule_id) return null
    const schedule = schedulesRepo.find(task.schedule_id)
    return schedule ? { id: schedule.id, title: schedule.title } : null
  }

  const selectedSchedule = ref(getSelectedSchedule(task.value))

  type voidFn = () => void
  type doneFn = (a: voidFn) => void

  const filterSelection = (val: string, update: doneFn) => {
    update(() => {
      if (val === '') {
        scheduleOptions.value = allSchedules
      } else {
        const query = val.toLowerCase()
        scheduleOptions.value = allSchedules.filter((x) =>
          x.title.toLowerCase().includes(query)
        )
      }
    })
  }

  const updateSchedule = () => {
    const scheduleId =
      typeof selectedSchedule.value === 'number'
        ? selectedSchedule.value
        : selectedSchedule.value?.id ?? null
    updateTask(task.value.id, { schedule_id: scheduleId })
  }
</script>
