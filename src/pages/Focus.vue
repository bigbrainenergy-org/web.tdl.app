<template>
  <div class="fixed-center" style="width: max(min(100%, 900px), 60%); text-align: center">
    <!-- Row 1: Top 2 Layer Zero Tasks -->
    <div class="row q-gutter-md justify-center">
      <q-card
        v-for="(task, idx) in topRow"
        :key="task.id"
        style="background-color: #1d1d1df6; flex: 1; max-width: 400px"
        class="q-ma-lg text-primary"
        :dark="useLocalSettingsStore().backgroundMode !== 'image'"
        flat
        bordered
      >
        <q-bar style="background-color: #333333">
          <div>{{ idx === 0 ? 'IN FOCUS' : 'ALSO IN FOCUS' }}</div>
          <q-space />
          <q-btn
            dense
            flat
            icon="fa fa-scissors"
            class="q-pr-sm"
            @click="slice(task)"
            @touchstart.stop
            @mousedown.stop
          />
          <q-btn
            dense
            flat
            icon="fa fa-info"
            class="q-pr-sm"
            @click="open(task)"
            @touchstart.stop
            @mousedown.stop
          />
          <q-btn
            dense
            flat
            icon="fa fa-plus"
            class="q-pr-sm"
            @click="addTaskPre(task)"
            @touchstart.stop
            @mousedown.stop
          >
            <q-tooltip anchor="top middle" self="bottom middle" :offset="[7, 7]">
              Add Prerequisites
            </q-tooltip>
          </q-btn>
          <q-btn dense flat icon="fa fa-check" @click="task.toggleCompleted()" />
          <q-btn dense flat icon="play_arrow" @click.stop="handleTimerClick(task)">
            <q-menu v-if="!task.task_duration_in_minutes" auto-close>
              <q-list style="min-width: 100px">
                <MenuListItem v-for="(menuItem, index) in menuitems" :key="index" :menu-item="menuItem" :item="task" />
              </q-list>
            </q-menu>
          </q-btn>
        </q-bar>
        <q-card-section class="text-h4">
          {{ task.title }}
        </q-card-section>
      </q-card>
      <q-card
        v-if="topRow.length === 0"
        style="background-color: #1d1d1df6; flex: 1; max-width: 400px"
        class="q-ma-lg text-primary"
        :dark="useLocalSettingsStore().backgroundMode !== 'image'"
        flat
        bordered
      >
        <q-card-section> No tasks in this list! </q-card-section>
      </q-card>
    </div>

    <!-- Row 2: Up Next Tasks -->
    <div class="row q-gutter-md justify-center" style="margin-top: 4%">
      <q-card
        v-for="task in bottomRow"
        :key="task.id"
        style="background-color: #1d1d1df6; color: #5d5d5d; flex: 1; max-width: 400px"
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
            @click="open(task)"
            @touchstart.stop
            @mousedown.stop
          />
          <q-btn
            dense
            flat
            icon="fa fa-plus"
            class="q-pr-sm"
            @click="addTaskPre(task)"
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
            @click="task.toggleCompleted().then(considerOpeningQuickSortDialog)"
            @touchstart.stop
            @mousedown.stop
          />
          <q-btn dense flat icon="play_arrow" @click.stop="handleTimerClick(task)">
            <q-menu v-if="!task.task_duration_in_minutes" auto-close>
              <q-list style="min-width: 100px">
                <MenuListItem v-for="(menuItem, index) in menuitems" :key="index" :menu-item="menuItem" :item="task" />
              </q-list>
            </q-menu>
          </q-btn>
        </q-bar>
        <q-card-section class="text-h4">
          {{ task.title }}
        </q-card-section>
      </q-card>
    </div>
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
    return useTaskStore().layerZero.value.sort(
      (a, b) => (a.task_duration_in_minutes ?? 1440) - (b.task_duration_in_minutes ?? 1440)
    )
  })

  // Row 1: Top 2 layer zero tasks
  const topRow = computed((): Task[] => {
    return layerZero.value.slice(0, 2)
  })

  // Row 2: Next 2 tasks - remaining layer zero OR top post-requisites of row 1 tasks
  const bottomRow = computed((): Task[] => {
    const topRowIds = new Set(topRow.value.map((t) => t.id))

    // Start with remaining layer zero tasks
    let candidates: Task[] = layerZero.value.filter((t) => !topRowIds.has(t.id))

    // Add post-requisites of top row tasks (only those with exactly 1 prereq)
    for (const task of topRow.value) {
      const posts = task.grabPostreqs(true).filter((x) => x.grabPrereqs(true).length === 1)
      for (const post of posts) {
        if (!topRowIds.has(post.id) && !candidates.some((c) => c.id === post.id)) {
          candidates.push(post)
        }
      }
    }

    // Sort by duration and take top 2
    candidates.sort((a, b) => (a.task_duration_in_minutes ?? 1440) - (b.task_duration_in_minutes ?? 1440))
    return candidates.slice(0, 2)
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
