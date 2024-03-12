<template>
  <q-page class="row items-center justify-evenly">
    <q-card>
      <q-card-section class="bg-grey-8 text-white">
        <q-item>
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <div class="text-h5">{{ $t('settings') }}</div>
          </q-item-section>
        </q-item>
      </q-card-section>

      <q-card-section class="text-center q-pa-md">
        <p>Current Time: {{ currentTime }}</p>
        <q-select
        v-model="editTimeZone"
        class="q-my-md"
        filled
        @update:model-value="updateTimeZone"
        :options="timeZones"
        option-value="value"
        option-label="name"
        label="Time Zone"
        />
        <LanguageSwitcher />
        <q-btn
          class="q-ma-md"
          icon="fas fa-bell"
          color="indigo"
          label="Test Notification"
        />

        <q-btn
          class="q-ma-md"
          icon="settings"
          color="indigo"
          label="Focus Mode Settings"
          @click="openFocusModeSettingsDialog"
        />

        <q-separator class="q-my-md" />

        <PasswordChangeForm />

        <q-separator class="q-my-md" />

        <p>
          This app is open source! Check out the code on
          <a
            href="https://github.com/bigbrainenergy-org/web.tdl.app"
            target="_blank"
          >Github</a>.
        </p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  onMounted,
  onBeforeUnmount,
  defineComponent
} from 'vue'

import { useQuasar } from 'quasar'

import { DateTime } from 'luxon'

import { useRepo } from 'pinia-orm'
import { useAuthenticationStore } from 'src/stores/authentication/pinia-authentication'
import { TimeZone, TimeZoneRepo } from 'src/stores/time-zones/time-zone'
import { UserRepo } from 'src/stores/users/user'
import FocusModeSettingsDialog from 'src/components/dialog/FocusModeSettingsDialog.vue'
import { useRouter } from 'vue-router'
import { Utils } from 'src/util'
import LanguageSwitcher from 'src/components/LanguageSwitcher.vue'
import PasswordChangeForm from 'src/components/PasswordChangeForm.vue'

defineComponent({name: 'SettingsPage'})

const r = useRouter()

const authenticationStore = useAuthenticationStore()
if(authenticationStore.isLoggedIn !== true) {
  r.push('/login')
}

const $q = useQuasar()
const tzr = useRepo(TimeZoneRepo)
const userRepo = computed(() => useRepo(UserRepo))

const currentTime = ref(DateTime.local().toFormat('h:mm:ss a ZZZZ'))


const userTimeZone = computed(
  () => Utils.hardCheck(userRepo.value.getUser(), 'no user found in authentication store or user repo').timeZoneObj
)

const timeZones = computed(
  () => tzr.all()
)

const user = computed(() => Utils.hardCheck(userRepo.value.getUser(), 'user not found in authentication store or user repo'))

function timeZoneName(tzToFind: any) {
  if (timeZones.value.length > 0) {
    return timeZones.value.find(
      (tz) => {
        return tz.value === tzToFind
      }
    )?.name
  } else {
    return undefined
  }
}

const editTimeZone = ref<TimeZone>(Utils.hardCheck(Utils.hardCheck(userRepo.value.getUser(), 'user not found').timeZoneObj))

const updateTimeZone = async () => {
  await userRepo.value.changeTimezone(editTimeZone.value as TimeZone)
}

let timer: NodeJS.Timeout | null = null

function updateCurrentTime() {
  currentTime.value = DateTime.local().toFormat('h:mm:ss a ZZZZ')
}

// If timer is active, deactivate it to free up memory / CPU.
function clearTimer() {
  if(timer) {
    clearInterval(timer)
    timer = null
  }
}

// If using KeepAlive to cache in the MainLayout, switch to onActivated
//onActivated(
onMounted(
  () =>{
    // Immediately update so the user doesn't notice a huge time jump after 1 second
    updateCurrentTime()
    // Restart timer
    timer = setInterval(
      () => {
        updateCurrentTime()
      },
      1000
    )
  }
)

// Uncomment if using KeepAlive in MainLayout to cache
// onDeactivated(
//   () => { clearTimer() }
// )
onBeforeUnmount(
  () => { clearTimer() }
)

const openFocusModeSettingsDialog = () => {
  $q.dialog({
    component: FocusModeSettingsDialog
  })
}
</script>
