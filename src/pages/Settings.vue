<template>
  <q-page class="row items-center justify-evenly">
    <q-card>
      <q-card-section class="bg-grey-8 text-white">
        <q-item>
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <div class="text-h5">Settings</div>
          </q-item-section>
        </q-item>
      </q-card-section>

      <q-card-section class="text-center q-pa-md">
        <p>Current Time: {{ currentTime }}</p>
        <q-select
          v-model="editTimeZone"
          filled
          @update:model-value="updateTimeZone"
          :options="timeZones"
          option-value="value"
          option-label="name"
          label="Time Zone"
        />
        <q-btn
          class="q-ma-md"
          icon="fas fa-bell"
          color="indigo"
          label="Test Notification"
        />

        <q-separator class="q-my-md" />

        <q-input
          v-model="currentPassword"
          class="q-my-md"
          filled
          type="password"
          label="Current Password"
        />
        <q-input
          v-model="newPassword"
          class="q-my-md"
          filled
          type="password"
          label="New Password"
          name="password"
        />
        <q-input
          v-model="confirmPassword"
          class="q-my-md"
          filled
          type="password"
          label="Confirm Password"
          name="confirm_password"
        />
        <q-btn
          class="full-width"
          color="orange"
          outline
          label="Change Password"
          @click="changePassword"
        />

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

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  onActivated,
  onDeactivated,
  onBeforeUnmount
} from 'vue'
import { useQuasar } from 'quasar'

import { DateTime } from 'luxon'
import { errorNotification } from '../hackerman/ErrorNotification'

import { TimeZoneInterface } from '../components/models'
import { useRepo } from 'pinia-orm'
import User from 'src/models/user'
import TimeZone from 'src/models/time_zone'
import { useUsersStore } from 'src/store/users/pinia-users'
import { useAuthenticationStore } from 'src/store/authentication/pinia-authentication'

export default defineComponent({
  name: 'PageSettings',

  preFetch() {
    const authenticationStore = useAuthenticationStore()
    if(authenticationStore.getLoggedIn !== true) {
      this.$router.push('/login')
    }
  },

  setup () {
    const $q = useQuasar()
    const timeZoneRepo = useRepo(TimeZone)
    const userStore = useUsersStore()

    const currentTime = ref(DateTime.local().toFormat('h:mm:ss a ZZZZ'))
    const currentPassword = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')

    const timeZone = computed(
      () => userStore.timeZone
    )

    const timeZones = computed(
      () => timeZoneRepo.all()
    )

    function timeZoneName(tzToFind: any) {
      if (timeZones.value.length > 0) {
        return timeZones.value.find(
          (tz: TimeZoneInterface) => {
            return tz.value === tzToFind
          }
        )?.name
      } else {
        return undefined
      }
    }

    const editTimeZone = ref({
      value: timeZone.value,
      name: timeZoneName(timeZone.value)
    })

    function updateTimeZone() {
      userStore.update({ timeZone: editTimeZone.value.value }).
      catch(
        (error: any) => {
          errorNotification(error, 'Failed to update time zone')
        }
      )
    }

    function changePassword() {
      if(newPassword.value !== confirmPassword.value) {
        $q.notify({
          color: 'negative',
          position: 'top',
          message: 'New password and confirm password didn\'t match, please try again',
          icon: 'report_problem'
        })
        newPassword.value = ''
        confirmPassword.value = ''
        return
      }
      userStore.changePassword({
        current_password: currentPassword.value,
        password: newPassword.value
      }).
      then(
        (response: any) => {
          currentPassword.value = ''
          newPassword.value = ''
          confirmPassword.value = ''
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Password changed!'
          })
        },
        (error: any) => {
          errorNotification(error, 'Failed to change password')
        }
      )
    }

    let timer: any = null

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

    onActivated(
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

    onDeactivated(
      () => { clearTimer() }
    )
    onBeforeUnmount(
      () => { clearTimer() }
    )

    return {
      currentTime,
      currentPassword,
      newPassword,
      confirmPassword,
      changePassword,
      timeZone,
      timeZones,
      editTimeZone,
      updateTimeZone,
      timeZoneName
    }
  }
})
</script>
