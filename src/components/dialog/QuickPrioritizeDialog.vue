<template>
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Quick Prioritize Task</div>
        <div class="text-h6">Which tasks should come after this task: {{ task.title }}</div>
        <q-btn class="q-ma-sm" size="md" color="positive" label="Save" @click="saveNewRules" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="Cancel" @click="onCancelClick" />
      </q-card-section>
      <q-linear-progress v-if="typeof saveProgress !== 'undefined'" stripe size="10px" :value="saveProgress" />
      <q-card-section>
        <q-btn class="q-ma-sm" size="md" color="negative" :label="layerZero.some(x => !x.selected) ? 'SELECT ALL' : 'UNSELECT ALL'" @click="selectAll" />
        <q-list class="text-primary">
          <q-intersection v-for="currentTask, index in layerZero" :key="index" once style="min-height: 48px;">
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
import { useLayerZeroStore } from 'src/stores/performance/layer-zero'
import { Task } from 'src/stores/tasks/task'
import { TDLAPP } from 'src/TDLAPP'
import { ref } from 'vue'

interface Props {
  task: Task
}

const saveProgress = ref<number | undefined>(undefined)
const prop = defineProps<Props>()
const emit = defineEmits([ ...useDialogPluginComponent.emits ])
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const layerZero = useLayerZeroStore().get()
  .filter(x => {
    if(x.id === prop.task.id) return false
    if(prop.task.hard_postreq_ids.includes(x.id)) return false
    return true
  })
  .map(x => ({ selected: false, obj: x }))
const saveNewRules = async () => {
  const selectedTasks = layerZero.filter(x => x.selected)
  saveProgress.value = 0
  // TODO: batch update this!
  for(let i = 0; i < selectedTasks.length; i++) {
    await TDLAPP.addPost(prop.task, selectedTasks[i].obj.id).then(() => saveProgress.value = (i+1) / selectedTasks.length)
  }
  onDialogCancel()
}
const selectAll = () => {
  if(layerZero.some(x => !x.selected)) layerZero.forEach(x => x.selected = true)
  else layerZero.forEach(x => x.selected = false)
}

const onCancelClick = onDialogCancel
</script>