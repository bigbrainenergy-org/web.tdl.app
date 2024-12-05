<script setup lang="ts">
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { useDialogPluginComponent } from 'quasar'
  import { storeToRefs } from 'pinia'
  import GloriousSlider from './GloriousSlider.vue'
  
  const {
    taskPostreqInfoView,
    strictModeMaxPostreqs
  } = storeToRefs(useLocalSettingsStore())
  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

  // const name = 'Configure These Options'
  const taskAppearanceOptions = [
    { label: 'Quantity', value: 'Quantity' },
    { label: 'Strict', value: 'Strict' }
  ]
</script>

<template>
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Task Appearance Settings</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onDialogCancel" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <q-btn-toggle v-model="taskPostreqInfoView" toggle-color="primary" :options="taskAppearanceOptions" label="Task Postreq Appearance Mode" />
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <GloriousSlider v-model:model-value="strictModeMaxPostreqs" :min="1" :max="6" :step="1" cuteName="Strict Mode Max Postreq Qty" color="primary" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
