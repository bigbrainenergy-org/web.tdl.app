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
import { useStore } from '../store'
import { DateTime } from 'luxon'
import { errorNotification } from '../hackerman/ErrorNotification'

import { TimeZone as TimeZoneInterface } from '../components/models'

export default defineComponent({
  name: 'PageSettings',

  preFetch({ store, redirect }) {
    if (!store.getters.authentication.isAuthenticated) {
      redirect({ path: '/login' })
    }
  },

  setup () {
    const $q = useQuasar()
    const $store = useStore()

    const currentTime = ref(DateTime.local().toFormat('h:mm:ss a ZZZZ'))

    const timeZone = computed(
      () => $store.getters.users.timeZone
    )

    const timeZones = computed(
      () => $store.state.timeZones.timeZones
    )

    function timeZoneName(tzToFind: any) {
      // @ts-ignore
      return timeZones.value.find(
        (tz: TimeZoneInterface) => {
          return tz.value === tzToFind
        }
      ).name
    }

    const editTimeZone = ref({
      value: timeZone.value,
      name: timeZoneName(timeZone.value)
    })

    function updateTimeZone() {
      $store.dispatch('users/update', {
        // Double value is intentional
        timeZone: editTimeZone.value.value
      }).
      catch(
        (error) => {
          errorNotification(error, 'Failed to update time zone')
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
      timeZone,
      timeZones,
      editTimeZone,
      updateTimeZone,
      timeZoneName
    }
  }
})
</script>
