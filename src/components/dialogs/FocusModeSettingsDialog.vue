<script setup lang="ts">
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import LazyVueComponent from '../lazy-vue/LazyVueComponent.vue'
  import { ref, watch } from 'vue'
  import { useDialogPluginComponent } from 'quasar'

  // todo: storeToRefs
  const disableQuickSort = ref<boolean>(useLocalSettingsStore().disableQuickSort)
  const enableQuickSortOnNewTask = ref<boolean>(useLocalSettingsStore().enableQuickSortOnNewTask)
  const enableQuickSortOnLayerZeroQTY = ref<number>(
    useLocalSettingsStore().enableQuickSortOnLayerZeroQTY
  )
  const settings = {
    'Disable Quick Sort': disableQuickSort,
    'Quick Sort On New Task': enableQuickSortOnNewTask,
    'Quick Sort When Length of Unblocked Tasks Reaches x': enableQuickSortOnLayerZeroQTY
  }

  watch(disableQuickSort, () => {
    useLocalSettingsStore().disableQuickSort = disableQuickSort.value
  })

  watch(enableQuickSortOnNewTask, () => {
    useLocalSettingsStore().enableQuickSortOnNewTask = enableQuickSortOnNewTask.value
  })

  watch(enableQuickSortOnLayerZeroQTY, () => {
    useLocalSettingsStore().enableQuickSortOnLayerZeroQTY = enableQuickSortOnLayerZeroQTY.value
  })

  const emit = defineEmits([...useDialogPluginComponent.emits])

  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

  const name = 'Configure These Options'
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
            <LazyVueComponent :data="settings" :edit="true" :name="name" :show-edit="false" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
