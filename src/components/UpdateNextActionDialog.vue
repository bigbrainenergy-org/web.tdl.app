<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Next Action Details</div>
        <template v-if="currentNextAction.completed !== true">
          <q-btn class="q-ma-sm" size="md" color="positive" label="Mark Complete" />
        </template>
        <template v-else>
          <q-btn class="q-ma-sm" size="md" color="primary" label="Mark Incomplete" />
        </template>
        <q-btn class="q-ma-sm" size="md" color="negative" label="Delete" @click="deleteNextAction(currentNextAction)" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12 col-md">
            <div class="text-h4 text-primary">{{ currentNextAction.title }}</div>
            <q-input
              v-model="editTitle"
              filled
              label="Task title"
              :placeholder="currentNextAction.title"
              @keyup.enter="updateNextAction({ title: editTitle })"
              clearable
              class="q-my-md"
            />
            <q-select
              v-model="selectedContext"
              filled
              clearable
              @update:model-value="updateNextAction({ context_id: selectedContext == null ? null : selectedContext.id })"
              :options="contexts"
              option-value="id"
              option-label="title"
              label="Context"
              class="q-my-md"
            />
            <q-select
              v-model="selectedProject"
              filled
              clearable
              @update:model-value="updateNextAction({ project_id: selectedProject == null ? null : selectedProject.id })"
              :options="projects"
              option-value="id"
              option-label="title"
              label="Project"
              class="q-my-md"
            />
            <q-datetime-input
              v-model="editRemindMeAt"
              @update:model-value="updateNextAction({ remind_me_at: editRemindMeAt })"
              label="Remind me at"
              class="q-my-md"
            />
            <q-list>
              <q-item class="q-my-sm">
                <q-item-section side>
                  <q-icon name="far fa-tired" />
                </q-item-section>

                <q-item-section>
                  <div>
                    <!-- <q-badge>Mental Energy Required</q-badge> -->

                    <q-slider
                      v-model="editMentalEnergyRequired"
                      @change="updateNextAction({ mental_energy_required: editMentalEnergyRequired })"
                      :min="0"
                      :max="100"
                      :step="1"
                      label
                      label-always
                      :label-value="`Mental ${editMentalEnergyRequired}%`"
                      color="blue"
                    />
                  </div>
                </q-item-section>

                <q-item-section side>
                  <q-icon name="fas fa-lightbulb" />
                </q-item-section>
              </q-item>

              <q-item class="q-my-sm">
                <q-item-section side>
                  <q-icon name="far fa-tired" />
                </q-item-section>

                <q-item-section>
                  <div>
                    <!-- <q-badge color="red">Physical Energy Required</q-badge> -->

                    <q-slider
                      v-model="editPhysicalEnergyRequired"
                      @change="updateNextAction({ physical_energy_required: editPhysicalEnergyRequired })"
                      :min="0"
                      :max="100"
                      :step="1"
                      label
                      label-always
                      :label-value="`Physical ${editPhysicalEnergyRequired}%`"
                      color="red"
                    />
                  </div>
                </q-item-section>

                <q-item-section side>
                  <q-icon name="fas fa-dumbbell" />
                </q-item-section>
              </q-item>
            </q-list>
            <br>
            <q-input
              v-model="editNotes"
              filled
              autogrow
              @update:model-value="updateNextAction({ notes: editNotes })"
              debounce="1000"
              label="Notes"
            />
          </div>

          <div class="col-12 col-md">
            <div class="row">
              <div class="col">
                <div class="text-h5">Prerequisites</div>
              </div>
              <div class="col text-right">
                <q-btn color="primary" icon="fas fa-link" label="Add Prerequisite" @click="openPrerequisiteDialog" />
              </div>
            </div>
            <q-list class="q-my-md">
              <q-item clickable v-ripple v-if="!currentNextAction.hard_prereqs.length">
                <q-item-section>No prerequisites</q-item-section>
              </q-item>
              <q-item
                clickable
                v-ripple
                v-for="pre in currentNextAction.hard_prereqs"
                :key="pre.id"
                @click="setCurrentNextAction(pre)"
              >
                <q-item-section>
                  {{ pre.title }}
                </q-item-section>

                <q-item-section avatar>
                  <q-btn round color="negative" icon="fas fa-unlink" @click.stop="true" />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="row">
              <div class="col">
                <div class="text-h5">Postrequisites</div>
              </div>
              <div class="col text-right">
                <q-btn color="primary" icon="fas fa-link" label="Add Postrequisite" />
              </div>
            </div>
            <q-list class="q-my-md">
              <q-item clickable v-ripple v-if="!currentNextAction.hard_postreqs.length">
                <q-item-section>No postrequisites</q-item-section>
              </q-item>
              <q-item
                clickable
                v-ripple
                v-for="post in currentNextAction.hard_postreqs"
                :key="post.id"
                @click="setCurrentNextAction(post)"
              >
                <q-item-section>
                  {{ post.title }}
                </q-item-section>

                <q-item-section avatar>
                  <q-btn round color="negative" icon="fas fa-unlink" @click.stop="true" />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="row">
              <div class="col">
                <div class="text-h5">Subtasks</div>
              </div>
              <div class="col text-right">
                <q-btn color="primary" icon="fas fa-tasks" label="Add Subtask" />
              </div>
            </div>
            <q-list class="q-my-md">
              <q-item clickable v-ripple>
                <q-item-section>No subtasks</q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { computed, defineComponent, ref } from 'vue';



import QDatetimeInput from 'components/QDatetimeInput.vue';
import NextActionSearchDialog from 'components/NextActionSearchDialog.vue';

import Context from '../models/context'
import Project from '../models/project'
import NextAction from '../models/next_action'
import { errorNotification } from '../hackerman/ErrorNotification'

export default {
  components: { QDatetimeInput },

  props: {
    next_action: {
      type: Object,
      required: true
    }
  },

  emits: [
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits
  ],

  setup (props) {
    // REQUIRED; must be called inside of setup()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    // dialogRef      - Vue ref to be applied to QDialog
    // onDialogHide   - Function to be used as handler for @hide on QDialog
    // onDialogOK     - Function to call to settle dialog with "ok" outcome
    //                    example: onDialogOK() - no payload
    //                    example: onDialogOK({ /*.../* }) - with payload
    // onDialogCancel - Function to call to settle dialog with "cancel" outcome

    const $q = useQuasar()
    

    const currentNextAction = ref(props.next_action)
    const editTitle = ref(currentNextAction.value.title)
    const editNotes = ref(currentNextAction.value.notes)
    const editRemindMeAt = ref(currentNextAction.value.remind_me_at)
    const editMentalEnergyRequired = ref(currentNextAction.value.mental_energy_required)
    const editPhysicalEnergyRequired = ref(currentNextAction.value.physical_energy_required)

    const projects = computed(
      () => $store.$repo(Project).all()
    )

    const contexts = computed(
      () => $store.$repo(Context).all()
    )

    function getSelectedContext(nextAction) {
      return (
        !!nextAction.context ?
        { id: nextAction.context.id, title: nextAction.context.title } :
        null
      )
    }

    function getSelectedProject(nextAction) {
      return (
        !!nextAction.project ?
        { id: nextAction.project.id, title: nextAction.project.title } :
        null
      )
    }

    const selectedContext = ref(getSelectedContext(currentNextAction.value))
    const selectedProject = ref(getSelectedProject(currentNextAction.value))

    function setCurrentNextAction(newNextAction) {
      currentNextAction.value = $store.$repo(NextAction).withAll().find(newNextAction.id)
      editTitle.value = currentNextAction.value.title
      editNotes.value = currentNextAction.value.notes
      editRemindMeAt.value = currentNextAction.value.remind_me_at
      editMentalEnergyRequired.value = currentNextAction.value.mental_energy_required
      editPhysicalEnergyRequired.value = currentNextAction.value.physical_energy_required
      selectedContext.value = getSelectedContext(currentNextAction.value)
      selectedProject.value = getSelectedProject(currentNextAction.value)
    }

    function deleteNextAction(next_action) {
      $q.dialog({
        title: `Delete next action: "${next_action.title}"`,
        message: 'This cannot be undone! Are you sure?',
        ok: {
          label: 'Delete',
          color: 'negative'
        },
        cancel: {
          color: 'grey'
        }
      }).onOk(
        () => {
          $store.dispatch('nextActions/delete', { id: next_action.id }).
          then(
            (response) => {
              onDialogOK()
            },
            (error) => {
              errorNotification(error, 'Failed to delete next action')
            }
          )
        }
      )
    }

    function updateNextAction(options) {
      $store.dispatch('nextActions/update', {
        id: currentNextAction.value.id,
        ...options
      }).
      then(
        (response) => {
          setCurrentNextAction(currentNextAction.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update next action')
        }
      )
    }

    function openPrerequisiteDialog() {
      $q.dialog({
        component: NextActionSearchDialog,

        componentProps: {
          dialogTitle: 'Add Prerequisite',
          nextAction: currentNextAction.value,
          onSelect: (payload) => { addPrereq(payload) },
        }
      })
    }

    function addPrereq(payload) {
      $store.dispatch('nextActions/update', {
        id: currentNextAction.value.id,
        hard_prereq_ids: [
          ...currentNextAction.value.hard_prereq_ids,
          payload.nextAction.id
        ]
      }).
      then(
        (response) => {
          $store.dispatch('nextActions/fetchNextAction', {
            id: payload.nextAction.id
          })
          setCurrentNextAction(currentNextAction.value)
          // hurr durr I'm a bad javascript programmer, but it works
          payload.callback(payload.nextAction)
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Added Prerequisite',
            icon: 'fas fa-link'
          })
        },
        (error) => {
          errorNotification(error, 'Failed to add prereq')
        }
      )
    }

    return {
      // Custom stuff
      currentNextAction,
      //
      editTitle,
      editNotes,
      editRemindMeAt,
      editMentalEnergyRequired,
      editPhysicalEnergyRequired,
      selectedContext,
      selectedProject,
      //
      contexts,
      projects,
      //
      setCurrentNextAction,
      updateNextAction,
      deleteNextAction,
      //
      openPrerequisiteDialog,
      //

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
