<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center q-mb-xs">
        <div class="text-h6">Inbox Review</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onCancelClick" />
      </q-card-section>

      <q-linear-progress
        :value="mainProgress"
        color="secondary"
        animation-speed="500"
        class="q-mb-xs"
      />
      <q-linear-progress
        :value="secondaryProgress"
        color="pink"
        animation-speed="500"
        :instant-feedback="instantFeedback"
      />

      <q-card-section class="full-height">
        <div class="row items-center justify-center q-gutter-md q-pa-sm">
          <div class="col-grow text-center">
            <template v-if="currentStep == 'actionable'">
              <div class="text-h3">Is it actionable?</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                icon="fas fa-lightbulb"
                label="No, it's information"
                @click="stepKeepForFuture"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                icon="task_alt"
                label="Yes, it can be completed"
                @click="stepMoreThanOneAction"
              />
            </template>

            <template v-else-if="currentStep == 'keepForFuture'">
              <div class="text-h3">Do you want to keep it for the future?</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="negative"
                icon="fas fa-trash"
                label="No, toss it"
                @click="stepTrash"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                icon="fas fa-clock"
                label="Yes, and I want to be reminded"
                @click="stepSomedayMaybe"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                icon="fas fa-search"
                label="Yes, but only for lookups"
                @click="stepReference"
              />
            </template>

            <template v-else-if="currentStep == 'somedayMaybe' || currentStep == 'reference'">
              <div class="text-h3">
                <template v-if="currentStep == 'somedayMaybe'">Someday/Maybe</template>
                <template v-else-if="currentStep == 'reference'">Reference</template>
              </div>

              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                icon="fas fa-check"
                label="Done!"
                @click="stepDone"
              />
            </template>

            <template v-else-if="currentStep == 'moreThanOneAction'">
              <div class="text-h3">Is there more than one action?</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                icon="far fa-check-square"
                label="No, just one"
                @click="stepTwoMinutes"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                icon="fas fa-project-diagram"
                label="Yes, multiple"
                @click="stepProjects"
              />
            </template>

            <template v-else-if="currentStep == 'twoMinutes'">
              <div class="text-h3">Will it take less than 2 minutes?</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                label="No"
                @click="stepBestPerson"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                label="Yes"
                @click="stepDoIt"
              />
            </template>

            <template v-else-if="currentStep == 'bestPerson'">
              <div class="text-h3">Are you the best person to complete this task?</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                label="No"
                @click="stepDelegate"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                label="Yes"
                @click="stepDefer"
              />
            </template>

            <template v-else-if="currentStep == 'delegate'">
              <div class="text-h3">Create a Waiting For</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                icon="fas fa-check"
                label="Done"
                @click="stepMoreActions"
              />
            </template>

            <template v-else-if="currentStep == 'defer'">
              <div class="text-h3">Does this need to be done at a specific time?</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                label="No, next action"
                @click="stepNextAction"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                label="Yes, calendar entry"
                @click="stepCalendar"
              />
            </template>

            <template v-else-if="currentStep == 'nextAction'">
              <div class="text-h3">Create a Next Action</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                icon="fas fa-check"
                label="Done"
                @click="stepMoreActions"
              />
            </template>

            <template v-else-if="currentStep == 'calendar'">
              <div class="text-h3">Create a Calendar Entry</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                icon="fas fa-check"
                label="Done"
                @click="stepMoreActions"
              />
            </template>

            <template v-else-if="currentStep == 'doIt'">
              <div class="text-h3">Just DO it! Don't let your dreams be dreams!</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                label="Just kidding, this takes more than 2 minutes"
                @click="stepDefer"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                icon="fas fa-check"
                label="Done!"
                @click="stepMoreActions"
              />
            </template>

            <template v-else-if="currentStep == 'moreActions'">
              <div class="text-h3">Are there any more next actions to add?</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                icon="fas fa-check"
                label="No, all done!"
                @click="stepDone"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                icon="add_task"
                label="Yes, add more"
                @click="stepTwoMinutes"
              />
            </template>

            <template v-else-if="currentStep == 'projects'">
              <div class="text-h3">Create a Project</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                icon="fas fa-check"
                label="Done"
                @click="stepProcessNow"
              />
            </template>

            <template v-else-if="currentStep == 'processNow'">
              <div class="text-h3">Do you want to process it for next actions now?</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                icon="far fa-clock"
                label="No, I'll do that later"
                @click="stepDone"
              />
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="primary"
                icon="add_task"
                label="Yes, let's do it"
                @click="stepProjectPlans"
              />
            </template>

            <template v-else-if="currentStep == 'projectPlans'">
              <div class="text-h3">Review any support materials, then start adding next actions.</div>
              <q-btn
                padding="lg"
                class="q-ma-lg"
                color="secondary"
                label="Start Processing Next Actions"
                @click="stepTwoMinutes"
              />
            </template>
          </div>
        </div>

        <q-inner-loading :showing="currentStep == 'done'" >
          <q-spinner-puff size="50px" color="pink" />
          <div class="text-pink q-mt-md" style="font-size: 1.1em;">Processing, please wait...</div>
        </q-inner-loading>
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

    const inboxItems = computed(
      () => $store.$repo(InboxItem).all()
    )

    const mainProgress = computed(
      () => {
        return (currentInboxCount.value / totalInboxCount.value)
      }
    )
    const secondaryProgress = computed(
      () => {
        return (currentStepCount.value / maxStepCount.value)
      }
    )

    console.log(inboxItems.value.length)

    // TODO: Should we safe guard against if this dialog gets called and
    //       inboxItems is 0? Shouldn't happen normally (button disabled)
    const totalInboxCount = ref(inboxItems.value.length - 1)
    const currentInboxCount = ref(0)

    const maxStepCount = ref(1)
    const currentStepCount = ref(0)
    const instantFeedback = ref(false)
    const processingProjectPlans = ref(false)

    const currentStep = ref('actionable')

    function setStepCount(current, max) {
      maxStepCount.value = max
      currentStepCount.value = current
    }

    function stepActionable() {
      instantFeedback.value = true
      setStepCount(0, 1)
      currentStep.value = 'actionable'
      let timeout = setTimeout(
        () => {
          instantFeedback.value = false
        },
        500
      )
    }

    function stepKeepForFuture() {
      setStepCount(1, 3)
      currentStep.value = 'keepForFuture'
    }

    function stepTrash() {
      setStepCount(2, 3)
      stepDone()
    }

    function stepSomedayMaybe() {
      setStepCount(2, 3)
      currentStep.value = 'somedayMaybe'
    }

    function stepReference() {
      setStepCount(2, 3)
      currentStep.value = 'reference'
    }

    function stepMoreThanOneAction() {
      setStepCount(1, 10)
      currentStep.value = 'moreThanOneAction'
    }

    function stepTwoMinutes() {
      if (processingProjectPlans.value) {
        setStepCount(5, 10)
      } else {
        setStepCount(2, 6)
      }
      currentStep.value = 'twoMinutes'
    }

    function stepBestPerson() {
      if (processingProjectPlans.value) {
        setStepCount(6, 10)
      } else {
        setStepCount(3, 6)
      }
      currentStep.value = 'bestPerson'
    }

    function stepDelegate() {
      if (processingProjectPlans.value) {
        setStepCount(7, 9)
      } else {
        setStepCount(4, 5)
      }
      currentStep.value = 'delegate'
    }

    function stepDefer() {
      if (processingProjectPlans.value) {
        setStepCount(7, 10)
      } else {
        setStepCount(4, 6)
      }
      currentStep.value = 'defer'
    }

    function stepNextAction() {
      if (processingProjectPlans.value) {
        setStepCount(8, 10)
      } else {
        setStepCount(5, 6)
      }
      currentStep.value = 'nextAction'
    }

    function stepCalendar() {
      if (processingProjectPlans.value) {
        setStepCount(8, 10)
      } else {
        setStepCount(5, 6)
      }
      currentStep.value = 'calendar'
    }

    function stepDoIt() {
      if (processingProjectPlans.value) {
        setStepCount(6, 8)
      } else {
        setStepCount(3, 4)
      }
      currentStep.value = 'doIt'
    }

    function stepMoreActions() {
      if (processingProjectPlans.value) {
        setStepCount(9, 10)
        currentStep.value = 'moreActions'
      } else {
        stepDone()
      }
    }

    function stepProjects() {
      setStepCount(2, 10)
      currentStep.value = 'projects'
    }

    function stepProcessNow() {
      setStepCount(3, 10)
      currentStep.value = 'processNow'
    }

    function stepProjectPlans() {
      setStepCount(4, 10)
      currentStep.value = 'projectPlans'
      processingProjectPlans.value = true
    }

    function stepDone() {
      // Display spinner while loading...
      currentStep.value = 'done'
      processingProjectPlans.value = false
      setStepCount(1, 1)
      // TODO: Delete inbox item here before executing the rest below.
      // Reset progress bar after short delay.
      let timeout = setTimeout(
        () => {
          currentInboxCount.value += 1
          if (currentInboxCount.value >= totalInboxCount.value) {
            // All done! Close up shop.
            onDialogOK()
          } else {
            stepActionable()
          }
        },
        1000
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
      instantFeedback,
      currentStep,
      //
      stepKeepForFuture,
      stepTrash,
      stepSomedayMaybe,
      stepReference,
      stepMoreThanOneAction,
      stepTwoMinutes,
      stepBestPerson,
      stepDelegate,
      stepDefer,
      stepNextAction,
      stepCalendar,
      stepDoIt,
      stepMoreActions,
      stepProjects,
      stepProcessNow,
      stepProjectPlans,
      stepDone,

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

