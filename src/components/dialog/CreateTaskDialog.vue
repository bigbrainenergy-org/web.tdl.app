<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Create Task</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <q-input
              v-model="title"
              filled
              clearable
              label="Title"
            />
            <br>
            <q-input
              v-model="notes"
              filled
              autogrow
              clearable
              label="Notes"
            />

            <br>

            <div class="row">
              <div class="col-grow">
                <q-btn
                  icon="fas fa-plus"
                  label="Create Task"
                  color="primary"
                  @click="createTask"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { ref } from 'vue';

const emit = defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
  'create'
])

// REQUIRED; must be called inside of setup()
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*.../* }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const title = ref('')
const notes = ref('')

const createTask = () => {
  emit('create', {
    options: {
      title: title.value,
      notes: notes.value
    },
    callback: clearFields
  })
}

const clearFields = () => {
  title.value = ''
  notes.value = ''
}

const onCancelClick = onDialogCancel
</script>

