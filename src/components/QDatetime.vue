<template>
  <q-card>
    <q-card-section class="bg-primary text-white text-center q-ma-none q-pa-none">
      <q-tabs v-model="activeTab">
        <q-tab icon="event" name="date" label="Date" />
        <q-tab icon="access_time" name="time" label="Time" :disable="!date" />
      </q-tabs>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-ma-none q-pa-none">
      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel class="q-pa-none" name="date">
          <q-date
            v-model="date"
            color="secondary"
            landscape
            square
            @update:model-value="gotoTime"
          />
        </q-tab-panel>

        <q-tab-panel class="q-pa-none" name="time">
          <q-time v-model="time" color="secondary" landscape square />
        </q-tab-panel>
      </q-tab-panels>
    </q-card-section>

    <q-separator />

    <div style="float: left" class="q-ma-md">
      {{ label }}
    </div>
    <q-card-actions align="right">
      <q-btn v-if="displayClearButton" flat @click="clear">Clear</q-btn>
      <template v-if="activeTab == 'date'">
        <q-btn flat @click="$emit('cancel')">Cancel</q-btn>
        <q-btn flat :disable="!date" @click="activeTab = 'time'">Next</q-btn>
      </template>
      <template v-else>
        <q-btn flat @click="activeTab = 'date'">Back</q-btn>
        <q-btn flat :disable="!date || !time" @click="save">Save</q-btn>
      </template>
    </q-card-actions>
  </q-card>
</template>

<script>
  import { watch, ref } from 'vue'
  import { useQuasar } from 'quasar'

  import { DateTime } from 'luxon'

  const DEFAULT_DATE = ''
  const DEFAULT_TIME = ''
  const DATE_FORMAT = 'yyyy/MM/dd'
  const TIME_FORMAT = 'HH:mm'

  export default {
    props: {
      modelValue: {
        type: String,
        default: ''
      },
      label: {
        type: String,
        default: ''
      },
      displayClearButton: {
        type: Boolean,
        default: false
      }
    },

    emits: ['cancel', 'update:modelValue'],

    setup(props, { emit }) {
      const $q = useQuasar()

      const activeTab = ref('date')
      const date = ref(DEFAULT_DATE)
      const time = ref(DEFAULT_TIME)

      function init(datetime) {
        if (!datetime) {
          date.value = DEFAULT_DATE
          time.value = DEFAULT_TIME
          return
        }

        let initDateTime = null

        if (datetime instanceof DateTime) {
          initDateTime = datetime
        } else if (datetime instanceof Date) {
          initDateTime = DateTime.fromJSDate(datetime)
        } else if (typeof datetime === 'string' || datetime instanceof String) {
          initDateTime = DateTime.fromISO(datetime)
        } else {
          return
        }

        date.value = initDateTime.toFormat(DATE_FORMAT)
        time.value = initDateTime.toFormat(TIME_FORMAT)
      }

      function gotoTime() {
        // if(date.value && !time.value) {
        if (date.value) {
          activeTab.value = 'time'
        }
      }

      function save() {
        let datetime = DateTime.fromFormat(
          date.value + ' ' + time.value,
          DATE_FORMAT + ' ' + TIME_FORMAT
        ).toISO()
        emit('update:modelValue', datetime)
      }

      function clear() {
        emit('update:modelValue', '')
      }

      init(props.modelValue)

      watch(
        () => props.modelValue,
        (newValue) => {
          init(newValue)
        }
      )

      return { activeTab, date, time, gotoTime, save, clear }
    }
  }
</script>
