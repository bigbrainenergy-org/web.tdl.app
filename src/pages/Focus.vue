<template>
  <div class="fixed-center" style="width: max(min(100%, 500px), 40%); text-align: center">
    <q-card
      style="background-color: #1d1d1df6"
      class="q-ma-lg text-primary"
      :dark="useLocalSettingsStore().backgroundMode !== 'image'"
      flat
      bordered
    >
      <q-bar v-if="currentTask" style="background-color: #333333">
        <div>IN FOCUS</div>
        <q-space />
        <q-btn
          dense
          flat
          icon="fa fa-scissors"
          class="q-pr-sm"
          @click="slice(currentTask)"
          @touchstart.stop
          @mousedown.stop
        />
        <q-btn
          dense
          flat
          icon="fa fa-info"
          class="q-pr-sm"
          @click="open(currentTask)"
          @touchstart.stop
          @mousedown.stop
        />
        <q-btn
          dense
          flat
          icon="fa fa-plus"
          class="q-pr-sm"
          @click="addTaskPre(currentTask)"
          @touchstart.stop
          @mousedown.stop
        >
          <q-tooltip anchor="top middle" self="bottom middle" :offset="[7, 7]">
            Add Prerequisites
          </q-tooltip>
        </q-btn>
        <q-btn dense flat icon="fa fa-check" @click="currentTask.toggleCompleted()" />
      </q-bar>
      <q-card-section v-if="currentTask" class="text-h4">
        {{ currentTask.title }}
      </q-card-section>
      <q-card-section v-else> No tasks in this list! </q-card-section>
    </q-card>
    <q-card
      style="background-color: #1d1d1df6; color: #5d5d5d; margin-top: 8%"
      class="q-ma-lg"
      :dark="useLocalSettingsStore().backgroundMode !== 'image'"
      flat
      bordered
    >
      <q-bar v-if="nextUp" style="background-color: #333333">
        <div>UP NEXT</div>
        <q-space />
        <q-btn
          dense
          flat
          icon="fa fa-info"
          class="q-pr-sm"
          @click="open(nextUp)"
          @touchstart.stop
          @mousedown.stop
        />
        <q-btn
          dense
          flat
          icon="fa fa-plus"
          class="q-pr-sm"
          @click="addTaskPre(nextUp)"
          @touchstart.stop
          @mousedown.stop
        >
          <q-tooltip anchor="top middle" self="bottom middle" :offset="[7, 7]">
            Add Prerequisites
          </q-tooltip>
        </q-btn>
        <q-btn
          dense
          flat
          icon="fa fa-check"
          @click="nextUp.toggleCompleted()"
          @touchstart.stop
          @mousedown.stop
        />
      </q-bar>
      <q-card-section v-if="nextUp" class="text-h4">
        {{ nextUp.title }}
      </q-card-section>
      <q-card-section v-else> No tasks in this list! </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
  import { useMeta } from 'quasar'
  // import QuickSortLayerZeroDialog from 'src/components/dialogs/QuickSortLayerZeroDialog.vue'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { Task } from 'src/stores/tasks/task-model'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { computed } from 'vue'
  import {
    addPrerequisitesDialog,
    openTaskSlicerDialog,
    openUpdateTaskDialog
  } from 'src/utils/dialog-utils'

  useMeta(() => ({ title: 'Focus | TDL App' }))

  const open = (task: Task) => openUpdateTaskDialog(task)

  const addTaskPre = addPrerequisitesDialog

  const slice = openTaskSlicerDialog

  const layerZero = computed(() => {
    return useTaskStore().layerZero.sort(
      (a, b) => b.incomplete_postreqs.length - a.incomplete_postreqs.length
    )
  })

  const currentTask = computed((): Task | null =>
    layerZero.value.length ? layerZero.value[0] : null
  )
  const nextUp = computed((): Task | null => {
    let arr: Array<Task> = Array.from(layerZero.value)
    if (currentTask.value !== null) {
      let posts = currentTask.value.grabPostreqs(true)
      posts = posts.filter((x) => x.grabPrereqs(true).length === 1)
      arr.push(...posts)
      arr = arr.filter((x) => x.id !== currentTask.value!.id)
    }
    arr.sort((a, b) => b.grabPostreqs(true).length - a.grabPostreqs(true).length)
    return arr.length > 0 ? arr[0] : null
  })
</script>
