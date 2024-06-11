<template>
  <div class="fixed-center" style="width: max(min(100%, 500px), 40%); text-align: center">
    <q-card
      style="background-color: #1d1d1df6"
      class="q-ma-lg text-primary"
      :dark="useLocalSettingsStore().backgroundMode !== 'image'"
      flat
      bordered
    >
      <q-bar style="background-color: #333333">
        <div>IN FOCUS</div>
        <q-space />
        <q-btn
          dense
          flat
          icon="fa fa-scissors"
          class="q-pr-sm"
          @click="slice(currentTask as Task)"
          @touchstart.stop
          @mousedown.stop
        />
        <q-btn
          dense
          flat
          icon="fa fa-info"
          class="q-pr-sm"
          @click="open(currentTask as Task)"
          @touchstart.stop
          @mousedown.stop
        />
        <q-btn
          dense
          flat
          icon="fa fa-plus"
          class="q-pr-sm"
          @click="addTaskPre(currentTask as Task)"
          @touchstart.stop
          @mousedown.stop
        >
          <q-tooltip anchor="top middle" self="bottom middle" :offset="[7, 7]">
            Add Prerequisites
          </q-tooltip>
        </q-btn>
        <q-btn dense flat icon="fa fa-check" @click=";(currentTask as Task).toggleCompleted()" />
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
      <q-bar style="background-color: #333333">
        <div>UP NEXT</div>
        <q-space />
        <q-btn
          dense
          flat
          icon="fa fa-info"
          class="q-pr-sm"
          @click="open(nextUp as Task)"
          @touchstart.stop
          @mousedown.stop
        />
        <q-btn
          dense
          flat
          icon="fa fa-plus"
          class="q-pr-sm"
          @click="addTaskPre(nextUp as Task)"
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
          @click=";(nextUp as Task).toggleCompleted()"
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
  import { useRepo } from 'pinia-orm'
  import { TDLAPP } from 'src/TDLAPP'
  // import QuickSortLayerZeroDialog from 'src/components/dialog/QuickSortLayerZeroDialog.vue'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { Task, TaskRepo } from 'src/stores/tasks/task'
  import { computed } from 'vue'

  const open = (task: Task) => TDLAPP.openTask(task)

  const addTaskPre = TDLAPP.addPrerequisitesDialog

  const slice = TDLAPP.sliceTask

  const layerZero = computed(() => {
    const incomplete = (x: Task) => !x.completed
    return useRepo(TaskRepo)
      .layerZero()
      .sort(
        (a, b) =>
          b.hard_postreqs.filter(incomplete).length - a.hard_postreqs.filter(incomplete).length
      )
  })

  const hasTooManyInLayerZero = () =>
    useLocalSettingsStore().enableQuickSortOnLayerZeroQTY > 0
      ? layerZero.value.length > useLocalSettingsStore().enableQuickSortOnLayerZeroQTY
      : false
  const hasNewTasksInLayerZero = () =>
    useLocalSettingsStore().enableQuickSortOnNewTask
      ? layerZero.value.filter((x) => x.hard_postreqs.filter((y) => !y.completed).length === 0)
          .length > 0
      : false
  const shouldSort = computed<boolean>({
    get: () => hasTooManyInLayerZero() || hasNewTasksInLayerZero(),
    set: (x) => {
      if (!x && !(hasTooManyInLayerZero() || hasNewTasksInLayerZero())) return x
    }
  })

  const currentTask = computed(() => (layerZero.value.length ? layerZero.value[0] : null))
  const nextUp = computed(() => {
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
