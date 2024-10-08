<template>
  <!-- notice dialogRef here -->
  <q-dialog
    ref="dialogRef"
    :maximized="$q.screen.lt.md"
    backdrop-filter="blur(4px)"
    data-cy="create_task_dialog"
    @hide="hideDialog"
  >
    <q-card class="q-dialog-plugin only-most-the-screen-lol">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Create Task</div>
        <q-btn
          class="q-ma-sm"
          size="md"
          color="grey"
          label="close"
          data-cy="close_dialog"
          @click="onCancelClick"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <q-input
              ref="titleInput"
              v-model="title"
              filled
              clearable
              label="Title"
              autofocus
              data-cy="task_title_input"
              @keyup.enter="focusNotes"
              @keydown.tab.exact.prevent="focusNotes"
            />
            <br>
            <q-input
              ref="notesInput"
              v-model="notes"
              filled
              autogrow
              clearable
              label="Notes"
              @keydown.shift.tab.exact.prevent="focusTitle"
              @keydown.ctrl.enter.exact.prevent="createTask"
            />

            <br>

            <div class="row">
              <div class="col-grow">
                <q-btn
                  icon="fas fa-plus"
                  label="Create Task"
                  color="primary"
                  data-cy="create_task_submit"
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
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { onMounted, ref } from 'vue'

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

  const titleInput = ref()
  const notesInput = ref()

  const focusTitle = () => {
    titleInput.value?.focus()
  }

  const focusNotes = () => {
    notesInput.value?.focus()
  }

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

  onMounted(() => {
    console.log('busy and createTaskDialogActive are true')
    useLoadingStateStore().busy = true
    useLoadingStateStore().createTaskDialogActive = true
  })

  const onCancelClick = () => {
    console.log('onCancelClick')
    useLoadingStateStore().busy = false
    useLoadingStateStore().createTaskDialogActive = false
    onDialogCancel()
  }

  const hideDialog = () => {
    console.log('hideDialog')
    useLoadingStateStore().busy = false
    useLoadingStateStore().createTaskDialogActive = false
    onDialogHide()
  }
</script>
