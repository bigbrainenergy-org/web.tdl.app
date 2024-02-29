<template>
  <div class="fixed-center" style="width: max(min(100%, 500px), 40%); text-align: center">
      <q-card style="background-color: #1d1d1df6" class="q-ma-lg text-primary">
        <q-bar style="background-color: #333333">
          <div>IN FOCUS</div>
          <q-space />
          <q-btn dense flat icon="fa fa-info" class="q-pr-sm" @click="open(currentTask as Task)"/>
          <q-btn dense flat icon="fa fa-plus" class="q-pr-sm" @click="addTaskPre(currentTask as Task)">
            <q-tooltip anchor="top middle" self="bottom middle" :offset="[7, 7]">
              Add Prerequisites
            </q-tooltip>
          </q-btn>
          <q-btn dense flat icon="fa fa-check" @click="useRepo(TaskRepo).toggleCompleted(currentTask as Task)"/>
        </q-bar>
        <q-card-section v-if="currentTask" class="text-h4">
          {{ currentTask.title }}
        </q-card-section>
        <q-card-section v-else>
          No tasks in this list!
        </q-card-section>
      </q-card>
      <q-card style="background-color: #1d1d1df6; color: #5d5d5d; margin-top: 8%" class="q-ma-lg">
        <q-bar style="background-color: #333333">
          <div>UP NEXT</div>
          <q-space />
          <q-btn dense flat icon="fa fa-info" class="q-pr-sm" @click="open(nextUp as Task)"/>
          <q-btn dense flat icon="fa fa-plus" class="q-pr-sm" @click="addTaskPre(nextUp as Task)">
            <q-tooltip anchor="top middle" self="bottom middle" :offset="[7, 7]">
              Add Prerequisites
            </q-tooltip>
          </q-btn>
          <q-btn dense flat icon="fa fa-check" @click="useRepo(TaskRepo).toggleCompleted(nextUp as Task)"/>
        </q-bar>
        <q-card-section v-if="nextUp" class="text-h4">
          {{ nextUp.title }}
        </q-card-section>
        <q-card-section v-else>
          No tasks in this list!
        </q-card-section>
      </q-card>
  </div>
</template>

<script setup lang="ts">
import { useRepo } from 'pinia-orm'
import { DialogChainObject, useQuasar } from 'quasar'
import { TDLAPP } from 'src/TDLAPP'
import QuickSortLayerZeroDialog from 'src/components/dialog/QuickSortLayerZeroDialog.vue'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { Utils } from 'src/util'
import { computed, ref, watch } from 'vue'

const $q = useQuasar()
const open = (task: Task) => TDLAPP.openTask(task)

const addTaskPre = (currentTask: Task) => {
  // TODO: research and actually understand the events lifecycle of a dialog
  TDLAPP.addPrerequisitesDialog(currentTask)
}

const layerZero = computed(() => {
  const incomplete = (x: Task) => !x.completed
  const tr = useRepo(TaskRepo)
  let lzero = tr.withAll().get()
  lzero = lzero.filter(x => !x.completed)
  lzero = lzero.filter(x => !x.hard_prereqs.some(y => !y.completed))
  lzero.sort((a, b) => b.hard_postreqs.filter(incomplete).length - a.hard_postreqs.filter(incomplete).length)
  return lzero
})

let d2: DialogChainObject | undefined
const l0len = computed(() => layerZero.value.length)
const handleTaskListTooLong = () => {
  if(useLocalSettingsStore().enableQuickSortOnLayerZeroQTY === 0) return
  console.debug('l0len changed to ', l0len.value)
  if(l0len.value >= useLocalSettingsStore().enableQuickSortOnLayerZeroQTY) {
    if(typeof d2 !== 'undefined') return
    console.debug('layer zero has gotten a bit large.')
    Utils.notifySuccess('Time to Prioritize Tasks!')
    d2 = $q.dialog({
      component: QuickSortLayerZeroDialog
    }).onOk(() => d2 = undefined)
  }
  else {
    if(typeof d2 !== 'undefined') {
      console.debug({d2})
      console.warn('conditions for handle task list too long are no longer met')
      console.warn('force closing dialog')
      d2.hide()
      d2 = undefined
      Utils.notifySuccess('Great Work!')
    }
  }
}
watch(l0len, () => {
  handleTaskListTooLong()
})

let d1: DialogChainObject | undefined
const zeroPostsLen = computed(() => layerZero.value.filter(x => x.hard_postreqs.filter(y => !y.completed).length === 0).length)
const handleZeroPostsOnTask = () => {
  if(!useLocalSettingsStore().enableQuickSortOnNewTask) return
  console.debug('zeroPostsLen changed to ', zeroPostsLen.value)
  if(zeroPostsLen.value > 0) {
    if(typeof d1 !== 'undefined') return
    console.debug('you have a new task to prioritize.')
    Utils.notifySuccess('You have a new task to prioritize!')
    d1 = $q.dialog({
      component: QuickSortLayerZeroDialog
    }).onOk(() => d1 = undefined)
  }
  else{
    if(typeof d1 !== 'undefined') {
      console.debug({d1})
      console.warn('conditions no longer met to quick sort new tasks')
      console.warn('force closing dialog')
      d1.hide()
      d1 = undefined
      Utils.notifySuccess('Great Work!')
    }
  }
}
watch(zeroPostsLen, () => {
  handleZeroPostsOnTask()
})

const currentTask = computed(() => layerZero.value.length ? layerZero.value[0] : null)
const nextUp = computed(() => {
  let arr: Array<Task> = Array.from(layerZero.value)
  if(currentTask.value !== null) {
    let posts = currentTask.value.grabPostreqs(true)
    posts = posts.filter(x => x.grabPrereqs(true).length === 1)
    arr.push(...posts)
    arr = arr.filter(x => x.id !== currentTask.value!.id)
  }
  arr.sort((a, b) => b.grabPostreqs(true).length - a.grabPostreqs(true).length)
  return arr.length > 0 ? arr[0] : null
})

handleZeroPostsOnTask()
handleTaskListTooLong()
</script>