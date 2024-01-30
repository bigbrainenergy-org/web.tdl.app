<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Quick Prioritize Task</div>
        <div class="text-h6">Which tasks should come after this task: {{ task.title }}</div>
        <q-btn class="q-ma-sm" size="md" color="positive" label="Save" @click="saveNewRules" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="Cancel" @click="onDialogCancel" />
      </q-card-section>
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
  <q-separator />
  <q-card-section>
    <div class="row q-gutter-md q-pa-sm">
      
    </div>
  </q-card-section>
</template>

<script setup lang="ts">
import { useRepo } from 'pinia-orm'
import { useDialogPluginComponent } from 'quasar'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { TDLAPP } from 'src/TDLAPP'
import { ref } from 'vue'

interface Props {
  task: Task
}
const prop = defineProps<Props>()
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const layerZero = ref(useRepo(TaskRepo).layerZero()
  .filter(x => {
    if(x.id === prop.task.id) return false
    if(prop.task.hard_postreq_ids.includes(x.id)) return false
    return true
  })
  .map(x => ({ selected: false, obj: x })))
const saveNewRules = () => {
  layerZero.value.filter(x => x.selected).forEach(x => {
    TDLAPP.addPost(prop.task, x.obj.id)
  })
  onDialogCancel()
}
const selectAll = () => {
  if(layerZero.value.some(x => !x.selected)) layerZero.value.forEach(x => x.selected = true)
  else layerZero.value.forEach(x => x.selected = false)
}
</script>