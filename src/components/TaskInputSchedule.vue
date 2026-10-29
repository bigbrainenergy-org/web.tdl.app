<template>
  <q-select
    v-model="schedule_id"
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
  />
</template>

<script setup lang="ts">
  import { useRepo } from 'pinia-orm'
  import { ref } from 'vue'
  import { ScheduleRepo } from 'src/stores/schedules/schedule'

  const schedule_id = defineModel<number | null | undefined>()

  const schedulesRepo = useRepo(ScheduleRepo)
  const allSchedules = schedulesRepo.all()
  const scheduleOptions = ref(allSchedules)

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
</script>
