<template>
  <q-select
    v-model="editTimeZone"
    class="q-my-md"
    filled
    :options="timeZones"
    option-value="value"
    option-label="name"
    label="Time Zone"
    @update:model-value="updateTimeZone"
  />
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRepo } from 'pinia-orm'
  import { TimeZone, TimeZoneRepo } from 'src/stores/time-zones/time-zone'
  import { UserRepo } from 'src/stores/users/user'
  import { hardCheck } from 'src/utils/type-utils'

  const timeZoneRepo = useRepo(TimeZoneRepo)
  const userRepo = useRepo(UserRepo)

  const user = computed(() =>
    hardCheck(userRepo.getUser(), 'user not found in authentication store or user repo')
  )

  const userTimeZone = computed(() => hardCheck(user.value).timeZoneObj)

  const timeZones = computed(() => timeZoneRepo.all())

  // Was originally used to construct the timezone object via:
  // const editTimeZone = ref({
  //   value: userTimeZone.value,
  //   name: timeZoneName(userTimeZone.value)
  // })
  // function timeZoneName(tzToFind: any) {
  //   if (timeZones.value.length > 0) {
  //     return timeZones.value.find(
  //       (tz) => {
  //         return tz.value === tzToFind
  //       }
  //     )?.name
  //   } else {
  //     return undefined
  //   }
  // }

  const editTimeZone = ref<TimeZone>(hardCheck(userTimeZone.value))

  const updateTimeZone = async () => {
    await userRepo.changeTimezone(editTimeZone.value as TimeZone)
  }
</script>
