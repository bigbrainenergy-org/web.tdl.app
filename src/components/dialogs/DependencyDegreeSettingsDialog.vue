<script setup lang="ts">
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { useDialogPluginComponent } from 'quasar'
  import { storeToRefs } from 'pinia'
  import GloriousToggle from 'src/components/glorious/GloriousToggle.vue'
  import DegreeStars from 'src/components/glorious/DegreeStars.vue'

  const {
    disableTaskBreakdown,
    taskBreakdownDegree,
    addDependencyDegree,
    quickSortLayerZeroDegree,
    quickSortPostsDegree,
    unsetDegreeBehavior
  } = storeToRefs(useLocalSettingsStore())
  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

  const handleUnsetDegreeUpdate = (val: 1 | 2 | 3 | null) => {
    if (val !== null) unsetDegreeBehavior.value = val
  }
</script>

<template>
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Dependency Degree Settings</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onDialogCancel" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <q-item>
              <q-item-section>
                <q-item-label>Task Breakdown Degree</q-item-label>
              </q-item-section>
              <q-item-section side>
                <DegreeStars v-model:model-value="taskBreakdownDegree" size="sm" />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Add Dependency Degree</q-item-label>
              </q-item-section>
              <q-item-section side>
                <DegreeStars v-model:model-value="addDependencyDegree" size="sm" />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Quick Sort Layer Zero Degree</q-item-label>
              </q-item-section>
              <q-item-section side>
                <DegreeStars v-model:model-value="quickSortLayerZeroDegree" size="sm" />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Quick Sort Posts Degree</q-item-label>
              </q-item-section>
              <q-item-section side>
                <DegreeStars v-model:model-value="quickSortPostsDegree" size="sm" />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Unset Degree Behavior</q-item-label>
              </q-item-section>
              <q-item-section side>
                <DegreeStars :model-value="unsetDegreeBehavior" size="sm" @update:model-value="handleUnsetDegreeUpdate" />
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
