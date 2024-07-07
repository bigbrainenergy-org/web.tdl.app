<template>
  <p>Current Time: {{ currentTime }}</p>
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
  import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
  import { DateTime } from 'luxon'
  import { useRepo } from 'pinia-orm'
  import { Utils } from 'src/util'
  import { TimeZone, TimeZoneRepo } from 'src/stores/time-zones/time-zone'
  import { UserRepo } from 'src/stores/users/user'

  const tzr = useRepo(TimeZoneRepo)
  const userRepo = computed(() => useRepo(UserRepo))

  const currentTime = ref(DateTime.local().toFormat('h:mm:ss a ZZZZ'))

  const user = computed(() =>
    Utils.hardCheck(userRepo.value.getUser(), 'user not found in authentication store or user repo')
  )

  const userTimeZone = computed(() => Utils.hardCheck(user.value).timeZoneObj)

  const timeZones = computed(() => tzr.all())

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

  const editTimeZone = ref<TimeZone>(Utils.hardCheck(userTimeZone.value))

  const updateTimeZone = async () => {
    await userRepo.value.changeTimezone(editTimeZone.value as TimeZone)
  }

  let timer: NodeJS.Timeout | null = null

  function updateCurrentTime() {
    currentTime.value = DateTime.local().toFormat('h:mm:ss a ZZZZ')
  }

  // If timer is active, deactivate it to free up memory / CPU.
  function clearTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  // If using KeepAlive to cache in the MainLayout, switch to onActivated
  //onActivated(
  onMounted(() => {
    // Immediately update so the user doesn't notice a huge time jump after 1 second
    updateCurrentTime()
    // Restart timer
    timer = setInterval(() => {
      updateCurrentTime()
    }, 1000)
  })

  // Uncomment if using KeepAlive in MainLayout to cache
  // onDeactivated(
  //   () => { clearTimer() }
  // )
  onBeforeUnmount(() => {
    clearTimer()
  })
</script>
