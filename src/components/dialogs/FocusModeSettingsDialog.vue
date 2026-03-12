<script setup lang="ts">
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { useDialogPluginComponent } from 'quasar'
  import { storeToRefs } from 'pinia'
  import GloriousSlider from 'src/components/glorious/GloriousSlider.vue'
  import GloriousToggle from 'src/components/glorious/GloriousToggle.vue'

  const {
    disableQuickSort,
    disableTaskBreakdown,
    enableQuickSortOnNewTask,
    enableQuickSortOnLayerZeroQTY,
    enableQuickSortBailOnBigTask,
    quickSortBailOnTaskSize
  } = storeToRefs(useLocalSettingsStore())
  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

  // const name = 'Configure These Options'
</script>

<template>
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Focus Mode Settings</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onDialogCancel" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <GloriousToggle v-model:model-value="disableQuickSort" label="Disable Quick Sort" />
            <GloriousToggle v-model:model-value="disableTaskBreakdown" label="Disable Task Breakdown" />
            <GloriousSlider
              v-model:model-value="enableQuickSortOnLayerZeroQTY"
              :min="1"
              :max="15"
              :step="1"
              cute-name="Max Layer Zero Tasks"
            />
            <GloriousToggle
              v-model:model-value="enableQuickSortOnNewTask"
              label="Quick Sort on Any Task w/o Postreqs"
            />
            <GloriousToggle
              v-model:model-value="enableQuickSortBailOnBigTask"
              label="Abort quick sort if there is a task with gobs of postreqs"
            />
            <GloriousSlider
              v-model:model-value="quickSortBailOnTaskSize"
              :min="3"
              :max="30"
              :step="1"
              cute-name="How many postreqs is too many?"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
