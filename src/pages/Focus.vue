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
        <q-btn dense flat icon="fa fa-check" @click="currentTask.toggleCompleted().then(considerOpeningQuickSortDialog)" />
        <q-btn dense flat icon="play_arrow" @click.stop="handleTimerClick(currentTask)">
          <q-menu v-if="!currentTask.task_duration_in_minutes" auto-close>
            <q-list style="min-width: 100px">
              <MenuListItem v-for="(menuItem, index) in menuitems" :key="index" :menu-item="menuItem" :item="currentTask" />
            </q-list>
          </q-menu>
        </q-btn>
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
          @click="nextUp.toggleCompleted().then(considerOpeningQuickSortDialog)"
          @touchstart.stop
          @mousedown.stop
        />
        <q-btn dense flat icon="play_arrow" @click.stop="handleTimerClick(nextUp)">
          <q-menu v-if="!nextUp.task_duration_in_minutes" auto-close>
            <q-list style="min-width: 100px">
              <MenuListItem v-for="(menuItem, index) in menuitems" :key="index" :menu-item="menuItem" :item="nextUp" />
            </q-list>
          </q-menu>
        </q-btn>
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
  import type { Task } from 'src/stores/tasks/task-model'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { computed } from 'vue'
  import {
    addPrerequisitesDialog,
    considerOpeningQuickSortDialog,
    openTaskSlicerDialog,
    openTimer,
    openUpdateTaskDialog
  } from 'src/utils/dialog-utils'
  import type { SimpleMenuItem } from 'src/utils/types'
  import { handleError, notifySuccess } from 'src/utils/notification-utils'
  import MenuListItem from 'src/components/MenuListItem.vue'

  useMeta(() => ({ title: 'Focus | TDL App' }))

  const open = (task: Task) => openUpdateTaskDialog(task)

  const addTaskPre = addPrerequisitesDialog

  const slice = openTaskSlicerDialog

  const layerZero = computed(() => {
    return useTaskStore().layerZero.sort(
      (a, b) => (a.task_duration_in_minutes ?? 1440) - (b.task_duration_in_minutes ?? 1440)
    )
  })

  const currentTask = computed((): Task | null =>
    layerZero.value.length ? layerZero.value[0]! : null // todo: seriously we need to figure out why ! is suddenly needed everywhere
  )
  const nextUp = computed((): Task | null => {
    let arr: Array<Task> = Array.from(layerZero.value)
    if (currentTask.value !== null) {
      let posts = currentTask.value.grabPostreqs(true)
      posts = posts.filter((x) => x.grabPrereqs(true).length === 1)
      arr.push(...posts)
      arr = arr.filter((x) => x.id !== currentTask.value!.id)
    }
    arr.sort((a, b) => (a.task_duration_in_minutes ?? 1440) - (b.task_duration_in_minutes ?? 1440))
    return arr.length > 0 ? arr[0]! : null // arr[0]! with ! is dumb!! ts, come on!
  })

  const startTimer = (task: Task) => {
    openTimer(task).onDismiss(considerOpeningQuickSortDialog).onCancel(considerOpeningQuickSortDialog).onOk(considerOpeningQuickSortDialog)
  }

  const updateEstimate = (est: number) => (task: Task) => {
    useTaskStore().apiUpdate(task.id, { task_duration_in_minutes: est }).then(() => {
      notifySuccess('Task Duration was Updated')
      task.task_duration_in_minutes = est
      startTimer(task)
    }, handleError('Error updating task'))
  }

  const menuitems: SimpleMenuItem<Task>[] = [
    {
      label: 'FAST',
      icon: 'rocket',
      action: updateEstimate(5)
    },
    {
      label: '10 minutes',
      icon: 'clock',
      action: updateEstimate(10)
    },
    {
      label: '15 minutes',
      icon: 'clock',
      action: updateEstimate(15)
    },
    {
      label: '30 minutes',
      icon: 'clock',
      action: updateEstimate(30)
    },
    {
      label: '45 minutes',
      icon: 'clock',
      action: updateEstimate(45)
    },
    {
      label: '75 minutes',
      icon: 'clock',
      action: updateEstimate(75)
    }
  ]

  const handleTimerClick = (task: Task) => {
    if(task.task_duration_in_minutes) {
      startTimer(task)
    }
  }
</script>
