<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized persistent>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center q-mb-xs">
        <div class="text-h6">Inbox Review</div>
        <template v-if="currentStep !== 'done'">
          <q-btn
            class="q-ma-sm"
            size="md"
            :color="content[currentStep].backColor !== undefined ? content[currentStep].backColor : 'grey'"
            :label="content[currentStep].backLabel !== undefined ? content[currentStep].backLabel : 'Close'"
            @click="content[currentStep].backAction !== undefined ? content[currentStep].backAction() : onCancelClick()"
          />
        </template>
        <template v-else>
          <q-btn
            class="q-ma-sm"
            size="md"
            color="grey"
            label="Close"
            disabled
          />
        </template>
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
        <template v-if="currentStep !== 'done'">
          <div class="row items-center justify-center q-gutter-md q-pa-sm">
            <div class="col-grow text-center">
              <div class="text-h3">{{ content[currentStep].prompt }}</div>

              <div class="q-my-lg">
                <template v-if="currentProject">
                  <div>{{ currentProject.title }}</div>
                  <div style="white-space: pre-line;" v-if="currentProject.notes">{{ currentProject.notes }}</div>
                </template>
                <template v-else>
                  <div>{{ currentInboxItem.title }}</div>
                  <div style="white-space: pre-line;" v-if="currentInboxItem.notes">{{ currentInboxItem.notes }}</div>
                </template>
              </div>

              <template v-if="currentStep === 'nextAction'">
                <q-input
                  v-model="nextActionTitle"
                  class="q-my-md"
                  filled
                  clearable
                  label="Title"
                />
                <q-input
                  v-model="nextActionNotes"
                  class="q-my-md"
                  filled
                  autogrow
                  clearable
                  label="Notes"
                />
              </template>
              <template v-else-if="currentStep === 'delegate'">
                <q-input
                  v-model="waitingForTitle"
                  class="q-my-md"
                  filled
                  clearable
                  label="Title"
                />
                <q-input
                  v-model="waitingForNotes"
                  class="q-my-md"
                  filled
                  autogrow
                  clearable
                  label="Notes"
                />
              </template>
              <template v-else-if="currentStep === 'projects'">
                <q-input
                  v-model="projectTitle"
                  class="q-my-md"
                  filled
                  clearable
                  label="Title"
                />
                <q-input
                  v-model="projectNotes"
                  class="q-my-md"
                  filled
                  autogrow
                  clearable
                  label="Notes"
                />
              </template>

              <q-btn
                v-for="button in content[currentStep].buttons"
                padding="lg"
                class="q-ma-lg"
                :key="button.label"
                :color="button.color"
                :icon="button.icon"
                :label="button.label"
                @click="button.click"
              />
            </div>
          </div>
        </template>

        <q-inner-loading :showing="currentStep === 'done'" >
          <q-spinner-puff size="50px" color="pink" />
          <div class="text-pink q-mt-md" style="font-size: 1.1em;">Processing, please wait...</div>
        </q-inner-loading>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useStore } from '../store'
import {
  ref,
  computed,
} from 'vue';

import InboxItem from '../models/inbox_item'
import Project from '../models/project'

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

    const nextActionTitle = ref('')
    const nextActionNotes = ref('')

    const waitingForTitle = ref('')
    const waitingForNotes = ref('')

    const projectTitle = ref('')
    const projectNotes = ref('')

    // TODO: Should we safe guard against if this dialog gets called and
    //       inboxItems is 0? Shouldn't happen normally (button disabled)
    const totalInboxCount = ref(inboxItems.value.length)
    const currentInboxCount = ref(0)
    const maxStepCount = ref(1)
    const currentStepCount = ref(0)

    const instantFeedback = ref(false)
    const processingProjectPlans = ref(false)

    const currentStep = ref('actionable')
    const currentInboxItem = ref(inboxItems.value[0])
    const currentProject = ref(null)

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

    function stepProjects() {
      setStepCount(2, 10)
      currentStep.value = 'projects'
    }

    function createProject() {
      $store.dispatch('projects/create', {
        title: projectTitle.value,
        notes: projectNotes.value
      }).
      then(
        (response) => {
          currentProject.value = $store.$repo(Project).find(response.data.id)
          projectTitle.value = ''
          projectNotes.value = ''
          stepProcessNow()
        },
        (error) => {
          errorNotification(error, 'Failed to create project')
        }
      )
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

    function createWaitingFor() {
      $store.dispatch('waitingFors/create', {
        title: waitingForTitle.value,
        notes: waitingForNotes.value
      }).
      then(
        (response) => {
          waitingForTitle.value = ''
          waitingForNotes.value = ''
          stepMoreActions()
        },
        (error) => {
          errorNotification(error, 'Failed to create waiting for')
        }
      )
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

    function createNextAction() {
      $store.dispatch('nextActions/create', {
        title: nextActionTitle.value,
        notes: nextActionNotes.value
      }).
      then(
        (response) => {
          nextActionTitle.value = ''
          nextActionNotes.value = ''
          stepMoreActions()
        },
        (error) => {
          errorNotification(error, 'Failed to create next action')
        }
      )
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

    function stepDone() {
      // Display spinner while loading...
      currentStep.value = 'done'
      processingProjectPlans.value = false
      currentProject.value = null
      setStepCount(1, 1)
      // TODO: Delete inbox item here before executing the rest below.
      $store.dispatch('inboxItems/delete', { id: currentInboxItem.value.id }).
      then(
        (response) => {
          if (inboxItems.value.length === 0) {
            // All done! Close up shop.
            onDialogOK()
          } else {
            currentInboxCount.value += 1
            currentInboxItem.value = inboxItems.value[0]
            // currentInboxItem.value = inboxItems.value[currentInboxCount.value]
            stepActionable()
          }
        },
        (error) => {
          // TODO: How do error handling?
          errorNotification(error, 'Failed to delete task')
        }
      )
    }

    const content = {
      'actionable': {
        prompt: 'Is it actionable?',
        buttons: [
          {
            color: 'primary',
            icon: 'task_alt',
            label: 'Yes, it can be completed',
            click: stepMoreThanOneAction,
          },
          {
            color: 'primary',
            icon: 'fas fa-lightbulb',
            label: 'No, it\'s information',
            click: stepKeepForFuture,
          },
        ]
      },
      'keepForFuture': {
        prompt: 'Do you want to keep it for the future?',
        backLabel: 'Back',
        backAction: stepActionable,
        buttons: [
          {
            color: 'positive',
            icon: 'fas fa-search',
            label: 'Yes, but only for lookups',
            click: stepReference,
          },
          {
            color: 'positive',
            icon: 'fas fa-clock',
            label: 'Yes, and I want to be reminded',
            click: stepSomedayMaybe,
          },
          {
            color: 'negative',
            icon: 'fas fa-trash',
            label: 'No, toss it',
            click: stepTrash,
          },
        ]
      },
      'somedayMaybe': {
        prompt: 'Someday/Maybe',
        backLabel: 'Back',
        backAction: stepKeepForFuture,
        buttons: [
          {
            color: 'secondary',
            icon: 'fas fa-check',
            label: 'Done!',
            click: stepDone,
          },
        ]
      },
      'reference': {
        prompt: 'Reference',
        backLabel: 'Back',
        backAction: stepKeepForFuture,
        buttons: [
          {
            color: 'secondary',
            icon: 'fas fa-check',
            label: 'Done!',
            click: stepDone,
          },
        ]
      },
      'moreThanOneAction': {
        prompt: 'Is there more than one action?',
        backLabel: 'Back',
        backAction: stepActionable,
        buttons: [
          {
            color: 'positive',
            icon: 'fas fa-project-diagram',
            label: 'Yes, multiple',
            click: stepProjects,
          },
          {
            color: 'primary',
            icon: 'far fa-check-square',
            label: 'No, just one',
            click: stepTwoMinutes,
          },
        ]
      },
      'projects': {
        prompt: 'Create a Project',
        backAction: stepMoreThanOneAction,
        buttons: [
          {
            color: 'primary',
            label: 'Create Project',
            click: createProject,
          },
        ]
      },
      'processNow': {
        prompt: 'Do you want to process it for next actions now?',
        backLabel: 'Back',
        backAction: stepProjects,
        buttons: [
          {
            color: 'primary',
            icon: 'add_task',
            label: 'Yes, let\'s do it now',
            click: stepProjectPlans,
          },
          {
            color: 'secondary',
            icon: 'far fa-clock',
            label: 'No, I\'ll do that later',
            click: stepDone,
          },
        ]
      },
      'projectPlans': {
        prompt: 'Review any support materials, then start adding next actions.',
        backLabel: 'Back',
        backAction: stepProcessNow,
        buttons: [
          {
            color: 'primary',
            icon: 'fas fa-tasks',
            label: 'Start Processing Next Actions',
            click: stepTwoMinutes,
          },
        ]
      },
      'twoMinutes': {
        prompt: 'Will it take less than 2 minutes? (starting right now)',
        buttons: [
          {
            color: 'positive',
            icon: 'fas fa-hourglass-start',
            label: 'Yes, 2 or less minutes',
            click: stepDoIt,
          },
          {
            color: 'primary',
            icon: 'fas fa-clock',
            label: 'No, it will take longer',
            click: stepBestPerson,
          },
        ]
      },
      'bestPerson': {
        prompt: 'Are you the best person to complete this task?',
        buttons: [
          {
            color: 'primary',
            icon: 'fas fa-clock',
            label: 'Yes, do this myself later',
            click: stepDefer,
          },
          {
            color: 'positive',
            icon: 'fas fa-user-clock',
            label: 'No, delegate it to someone else',
            click: stepDelegate,
          },
        ]
      },
      'delegate': {
        prompt: 'Create a Waiting For',
        buttons: [
          {
            color: 'secondary',
            label: 'Create Waiting For',
            click: createWaitingFor,
          },
        ]
      },
      'defer': {
        prompt: 'Does this need to be done at a specific time?',
        buttons: [
          {
            color: 'positive',
            icon: 'fas fa-calendar-check',
            label: 'Yes, create a calendar entry',
            click: stepCalendar,
          },
          {
            color: 'positive',
            icon: 'fas fa-tasks',
            label: 'No, create a next action',
            click: stepNextAction,
          },
        ]
      },
      'nextAction': {
        prompt: 'Create a Next Action',
        buttons: [
          {
            color: 'secondary',
            label: 'Create Next Action',
            click: createNextAction,
          },
        ]
      },
      'calendar': {
        prompt: 'Create a Calendar Entry',
        buttons: [
          {
            color: 'secondary',
            icon: 'fas fa-check',
            label: 'Done',
            click: stepMoreActions,
          },
        ]
      },
      'doIt': {
        prompt: 'Just DO it! Don\'t let your dreams be dreams!',
        buttons: [
          {
            color: 'secondary',
            icon: 'fas fa-check',
            label: 'Done!',
            click: stepMoreActions,
          },
          {
            color: 'primary',
            icon: 'fas fa-undo-alt',
            label: 'Just kidding, this takes more than 2 minutes',
            click: stepBestPerson,
          },
        ]
      },
      'moreActions': {
        prompt: 'Are there any more next actions to add?',
        buttons: [
          {
            color: 'primary',
            icon: 'add_task',
            label: 'Yes, add more',
            click: stepTwoMinutes,
          },
          {
            color: 'secondary',
            icon: 'fas fa-check',
            label: 'No, all done!',
            click: stepDone,
          },
        ]
      },
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
      content,
      //
      mainProgress,
      secondaryProgress,
      instantFeedback,
      currentStep,
      currentInboxItem,
      currentProject,
      processingProjectPlans,
      //
      nextActionTitle,
      nextActionNotes,
      waitingForTitle,
      waitingForNotes,
      projectTitle,
      projectNotes,
      //
      createNextAction,
      createWaitingFor,
      createProject,
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

