<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useDialogPluginComponent } from 'quasar'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import GloriousToggle from '../GloriousToggle.vue'
  const { toolbarButtons } = storeToRefs(useLocalSettingsStore())
  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
</script>
<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Toolbar Settings</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onDialogCancel" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <GloriousToggle
              v-for="toolbarButton in toolbarButtons"
              :key="toolbarButton.to"
              v-model="toolbarButton.enabled"
              :label="toolbarButton.label"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
