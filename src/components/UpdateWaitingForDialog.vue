<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Waiting For Details</div>
        <q-btn class="q-ma-sm" size="md" color="negative" label="Delete" @click="deleteWaitingFor(currentWaitingFor)" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12 col-md">
            <div class="text-h4 text-primary">{{ currentWaitingFor.title }}</div>
            <br>
            <q-input
              v-model="editWaitingForTitle"
              filled
              label="Task title"
              :placeholder="currentWaitingFor.title"
              @keyup.enter="updateWaitingForTitle"
              clearable
            />
            <br>
            <q-input
              v-model="editWaitingForNotes"
              filled
              autogrow
              @update:model-value="updateWaitingForNotes"
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



import WaitingFor from '../models/waiting_for'
import { errorNotification } from '../hackerman/ErrorNotification'

export default {
  props: {
    waiting_for: {
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
    

    const currentWaitingFor = ref(props.waiting_for)
    const editWaitingForTitle = ref(currentWaitingFor.value.title)
    const editWaitingForNotes = ref(currentWaitingFor.value.notes)

    function setCurrentWaitingFor(newWaitingFor) {
      currentWaitingFor.value = $store.$repo(WaitingFor).find(newWaitingFor.id)
      editWaitingForTitle.value = currentWaitingFor.value.title
      editWaitingForNotes.value = currentWaitingFor.value.notes
    }

    function deleteWaitingFor(waiting_for) {
      $q.dialog({
        title: `Delete waiting for: "${waiting_for.title}"`,
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
          $store.dispatch('waitingFors/delete', { id: waiting_for.id }).
          then(
            (response) => {
              onDialogOK()
            },
            (error) => {
              errorNotification(error, 'Failed to delete waiting for')
            }
          )
        }
      )
    }

    function updateWaitingForTitle() {
      if (editWaitingForTitle.value === currentWaitingFor.value.title) { return }

      $store.dispatch('waitingFors/update', {
        id: currentWaitingFor.value.id,
        title: editWaitingForTitle.value
      }).
      then(
        (response) => {
          setCurrentWaitingFor(currentWaitingFor.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update waiting for title')
        }
      )
    }

    function updateWaitingForNotes() {
      if (editWaitingForNotes.value === currentWaitingFor.value.notes) { return }

      $store.dispatch('waitingFors/update', {
        id: currentWaitingFor.value.id,
        notes: editWaitingForNotes.value
      }).
      then(
        (response) => {
          setCurrentWaitingFor(currentWaitingFor.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update waiting for notes')
        }
      )
    }

    return {
      // Custom stuff
      currentWaitingFor,
      editWaitingForTitle,
      editWaitingForNotes,
      //
      updateWaitingForTitle,
      updateWaitingForNotes,
      deleteWaitingFor,
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
