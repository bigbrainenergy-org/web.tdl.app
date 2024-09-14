<template>
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Quick Prioritize Task</div>
        <div class="text-h6">Which tasks should come after this task: {{ task.title }}</div>
        <q-btn class="q-ma-sm" size="md" color="positive" label="Save" @click="saveNewRules" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="Cancel" @click="onCancelClick" />
      </q-card-section>
      <q-linear-progress
        v-if="typeof saveProgress !== 'undefined'"
        stripe
        size="10px"
        :value="saveProgress"
      />
      <q-card-section>
        <q-btn
          class="q-ma-sm"
          size="md"
          color="negative"
          :label="layerZero.some((x) => !x.selected) ? 'SELECT ALL' : 'UNSELECT ALL'"
          @click="selectAll"
        />
        <q-list class="text-primary">
          <q-intersection
            v-for="(currentTask, index) in layerZero"
            :key="index"
            once
            style="min-height: 48px"
          >
            <q-item>
              <q-checkbox v-model:model-value="currentTask.selected" color="primary" keep-color />
              <q-item-section>{{ currentTask.obj.title }}</q-item-section>
            </q-item>
          </q-intersection>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent } from 'quasar'
  import { ref } from 'vue'
  import { useT2Store } from 'src/stores/t2/t2-store'
  import { T2 } from 'src/stores/t2/t2-model'

  interface Props {
    task: T2
  }

  const saveProgress = ref<number | undefined>(undefined)
  const prop = defineProps<Props>()
  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
  const layerZero = ref<{ selected: boolean; obj: T2 }[]>(
    useT2Store()
      .layerZero.filter((x: T2) => {
        if (x.id === prop.task.id) return false
        if (prop.task.anyIDsBelow([x.id])) return false
        return true
      })
      .map((x: T2) => ({ selected: false, obj: x }))
  )
  const saveNewRules = () => {
    const selectedTasks = layerZero.value.filter((x) => x.selected)
    saveProgress.value = 0
    // TODO: batch update this!
    for (let i = 0; i < selectedTasks.length; i++) {
      const element = layerZero.value[i]
      useT2Store()
        .addRule(prop.task.id, element.obj.id)
        .then(() => (saveProgress.value = (i + 1) / selectedTasks.length))
    }
    onDialogCancel()
  }
  const selectAll = () => {
    if (layerZero.value.some((x) => !x.selected))
      layerZero.value.forEach((x) => (x.selected = true))
    else layerZero.value.forEach((x) => (x.selected = false))
  }

  const onCancelClick = onDialogCancel
</script>
