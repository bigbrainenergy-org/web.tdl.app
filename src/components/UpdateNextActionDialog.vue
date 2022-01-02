<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Next Action Details</div>
        <q-btn class="q-ma-sm" size="md" color="negative" label="Delete" @click="deleteNextAction(currentNextAction)" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12 col-md">
            <div class="text-h4 text-primary">{{ currentNextAction.title }}</div>
            <br>
            <q-input
              v-model="editNextActionTitle"
              filled
              label="Task title"
              :placeholder="currentNextAction.title"
              @keyup.enter="updateNextActionTitle"
              clearable
            />
            <br>
            <q-input
              v-model="editNextActionNotes"
              filled
              autogrow
              @update:model-value="updateNextActionNotes"
              debounce="1000"
              label="Notes"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { defineComponent, ref } from 'vue';

import { useStore } from '../store'

import NextAction from '../models/next_action'
import { errorNotification } from '../hackerman/ErrorNotification'

export default {
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
    const $store = useStore()

    const currentNextAction = ref(props.next_action)
    const editNextActionTitle = ref(currentNextAction.value.title)
    const editNextActionNotes = ref(currentNextAction.value.notes)

    function setCurrentNextAction(newNextAction) {
      currentNextAction.value = $store.$repo(NextAction).find(newNextAction.id)
      editNextActionTitle.value = currentNextAction.value.title
      editNextActionNotes.value = currentNextAction.value.notes
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

    function updateNextActionTitle() {
      if (editNextActionTitle.value === currentNextAction.value.title) { return }

      $store.dispatch('nextActions/update', {
        id: currentNextAction.value.id,
        title: editNextActionTitle.value
      }).
      then(
        (response) => {
          setCurrentNextAction(currentNextAction.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update next action title')
        }
      )
    }

    function updateNextActionNotes() {
      if (editNextActionNotes.value === currentNextAction.value.notes) { return }

      $store.dispatch('nextActions/update', {
        id: currentNextAction.value.id,
        notes: editNextActionNotes.value
      }).
      then(
        (response) => {
          setCurrentNextAction(currentNextAction.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update next action notes')
        }
      )
    }

    return {
      // Custom stuff
      currentNextAction,
      editNextActionTitle,
      editNextActionNotes,
      //
      updateNextActionTitle,
      updateNextActionNotes,
      deleteNextAction,
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
