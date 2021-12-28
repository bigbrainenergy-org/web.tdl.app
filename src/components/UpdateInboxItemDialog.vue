<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Inbox Item Details</div>
        <q-btn class="q-ma-sm" size="md" color="positive" label="Begin Review" />
        <q-btn class="q-ma-sm" size="md" color="negative" label="Delete" @click="deleteInboxItem(currentInboxItem)" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12 col-md">
            <div class="text-h4 text-primary">{{ currentInboxItem.title }}</div>
            <br>
            <q-input
              v-model="editInboxItemTitle"
              filled
              label="Task title"
              :placeholder="currentInboxItem.title"
              @keyup.enter="updateInboxItemTitle"
              clearable
            />
            <br>
            <q-input
              v-model="editInboxItemNotes"
              filled
              autogrow
              @update:model-value="updateInboxItemNotes"
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

import InboxItem from '../models/inbox_item'
import { errorNotification } from '../hackerman/ErrorNotification'

export default {
  props: {
    inbox_item: {
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

    const currentInboxItem = ref(props.inbox_item)
    const editInboxItemTitle = ref(currentInboxItem.value.title)
    const editInboxItemNotes = ref(currentInboxItem.value.notes)

    function setCurrentInboxItem(newInboxItem) {
      currentInboxItem.value = $store.$repo(InboxItem).find(newInboxItem.id)
      editInboxItemTitle.value = currentInboxItem.value.title
      editInboxItemNotes.value = currentInboxItem.value.notes
    }

    function deleteInboxItem(inbox_item) {
      $q.dialog({
        title: `Delete inbox item: "${inbox_item.title}"`,
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
          $store.dispatch('inboxItems/delete', { id: inbox_item.id }).
          then(
            (response) => {
              onDialogOK()
            },
            (error) => {
              errorNotification(error, 'Failed to delete inbox item')
            }
          )
        }
      )
    }

    function updateInboxItemTitle() {
      if (editInboxItemTitle.value === currentInboxItem.value.title) { return }

      $store.dispatch('inboxItems/update', {
        id: currentInboxItem.value.id,
        title: editInboxItemTitle.value
      }).
      then(
        (response) => {
          setCurrentInboxItem(currentInboxItem.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update inbox item title')
        }
      )
    }

    function updateInboxItemNotes() {
      if (editInboxItemNotes.value === currentInboxItem.value.notes) { return }

      $store.dispatch('inboxItems/update', {
        id: currentInboxItem.value.id,
        notes: editInboxItemNotes.value
      }).
      then(
        (response) => {
          setCurrentInboxItem(currentInboxItem.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update inbox item notes')
        }
      )
    }

    return {
      // Custom stuff
      currentInboxItem,
      editInboxItemTitle,
      editInboxItemNotes,
      //
      updateInboxItemTitle,
      updateInboxItemNotes,
      deleteInboxItem,
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
