<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Slice a Task</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onDialogCancel" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <q-input
              v-model.number="slices"
              filled
              clearable
              label="Number of Slices"
              @touchstart.stop
              @mousedown.stop
            />
            <br />
            <div class="row">
              <div class="col-grow">
                <q-btn icon="fas fa-plus" label="Slice Task" color="primary" @click="sliceTask" />
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
  import { ref } from 'vue'
  import { handleError } from 'src/utils/notification-utils'
  import { Task } from 'src/stores/tasks/task-model'

  const props = defineProps<{ task: Task }>()

  const emit = defineEmits([...useDialogPluginComponent.emits])

  const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

  const slices = ref(0)

  const sliceTask = async () => {
    await props.task.split(slices.value).then(onDialogOK, handleError('Error slicing task.'))
  }
</script>
