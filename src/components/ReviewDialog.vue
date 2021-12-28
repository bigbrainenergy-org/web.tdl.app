<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center q-mb-xs">
        <div class="text-h6">Choose Review Type</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onCancelClick" />
      </q-card-section>

      <q-linear-progress :value="mainProgress" color="secondary" class="q-mb-xs" />
      <q-linear-progress :value="secondaryProgress" color="pink" v-show="showSecondaryProgress" />

      <q-card-section>
        <div class="row items-center justify-center q-gutter-md q-pa-sm" full-height>
          <div class="col-grow text-center">
            <template v-if="reviewType == 'tbd'">
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                icon="fas fa-calendar-day"
                label="Daily Review"
                @click="startDailyReview"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                icon="fas fa-calendar-week"
                label="Weekly Review"
                @click="startWeeklyReview"
              />
            </template>

            <template v-else-if="reviewType == 'daily'">
              <template v-if="currentStep == 1">
                <div class="text-h2">Review Tomorrow's Calendar</div>
                <p>Are there any more inbox items you need to add?</p>
                <q-btn
                  padding="lg"
                  class="q-ma-lg"
                  color="positive"
                  label="Yes, add them"
                  @click="openCreateInboxItemDialog"
                />
                <q-btn
                  padding="lg"
                  class="q-ma-lg"
                  color="primary"
                  label="No, continue"
                  @click="currentStep = 2"
                />
                <br>
                <q-btn
                  padding="lg"
                  class="q-ma-lg"
                  color="grey"
                  label="Wait, go back!"
                  @click="backToStart"
                />
              </template>

              <template v-else-if="currentStep == 2">
                <div class="text-h2">Get to inbox zero</div>
                <q-btn
                  padding="lg"
                  class="q-ma-lg"
                  color="positive"
                  label="Done!"
                  v-if="secondaryProgress == 1"
                  @click="currentStep = 3"
                />
              </template>

              <template v-else-if="currentStep == 3">
                <div class="text-h1">Congratulations!</div>
                <p>You're done!</p>
                <q-btn
                  padding="lg"
                  class="q-ma-lg"
                  color="grey"
                  label="Close"
                  @click="onCancelClick"
                />
              </template>
            </template>

            <template v-else-if="reviewType == 'weekly'">
              <h1>Weekly</h1>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="grey"
                label="Wait, go back!"
                @click="backToStart"
              />
            </template>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import InboxItem from '../models/inbox_item'
import { useStore } from '../store'
import {
  ref,
  computed,
} from 'vue';

import CreateInboxItemDialog from 'components/CreateInboxItemDialog.vue'
import { errorNotification } from '../hackerman/ErrorNotification'

export default {
  emits: [
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits
  ],

  setup (props, { emit }) {
    const $q = useQuasar()
    const $store = useStore()

    const mainProgress = computed(
      () => {
        return (currentStep.value / maxSteps.value)
      }
    )
    const secondaryProgress = computed(
      () => {
        return (secondaryCurrent.value / secondaryMax.value)
      }
    )
    const reviewType = ref('tbd')

    const maxSteps = ref(1)
    const currentStep = ref(0)

    const secondaryMax = ref(1)
    const secondaryCurrent = ref(0)
    const showSecondaryProgress = computed(
      () => {
        return (reviewType.value == 'daily' && currentStep.value == 2)
      }
    )

    function startDailyReview() {
      reviewType.value = 'daily'
      maxSteps.value = 3
      currentStep.value = 1
    }

    function startWeeklyReview() {
      reviewType.value = 'weekly'
      maxSteps.value = 3
      currentStep.value = 1
    }

    function backToStart() {
      reviewType.value = 'tbd'
      maxSteps.value = 1
      currentStep.value = 0
    }

    // TODO: Extract this into a partial.
    function openCreateInboxItemDialog() {
      $q.dialog({
        component: CreateInboxItemDialog,

        componentProps: {
          onCreate: (payload) => { createInboxItem(payload) }
        }
      })
    }

    function createInboxItem(payload) {
      $store.dispatch('inboxItems/create', payload.options).
      then(
        (response) => {
          payload.callback()
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Created inbox item',
            icon: 'fas fa-tasks'
          })
        },
        (error) => {
          errorNotification(error, 'Failed to create inbox item')
        }
      )
    }

    // REQUIRED; must be called inside of setup()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    // dialogRef      - Vue ref to be applied to QDialog
    // onDialogHide   - Function to be used as handler for @hide on QDialog
    // onDialogOK     - Function to call to settle dialog with "ok" outcome
    //                    example: onDialogOK() - no payload
    //                    example: onDialogOK({ /*.../* }) - with payload
    // onDialogCancel - Function to call to settle dialog with "cancel" outcome

    return {
      // Custom stuff
      mainProgress,
      secondaryProgress,
      reviewType,
      currentStep,
      showSecondaryProgress,
      //
      startDailyReview,
      startWeeklyReview,
      backToStart,
      openCreateInboxItemDialog,

      // This is REQUIRED;
      // Need to inject these (from useDialogPluginComponent() call)
      // into the vue scope for the vue html template
      dialogRef,
      onDialogHide,

      // other methods that we used in our vue html template;
      // these are part of our example (so not required)
      onOKClick () {
        // on OK, it is REQUIRED to
        // call onDialogOK (with optional payload)
        onDialogOK()
        // or with payload: onDialogOK({ ... })
        // ...and it will also hide the dialog automatically
      },

      // we can passthrough onDialogCancel directly
      onCancelClick: onDialogCancel
    }
  }
}
</script>

