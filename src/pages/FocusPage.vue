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
        <q-card-section v-if="currentTask">
          {{ currentTask.title }}
        </q-card-section>
        <q-card-section v-else>
          No tasks in this list!
        </q-card-section>
      </q-card>
      <q-card style="background-color: #1d1d1df6; color: #5d5d5d;" class="q-ma-lg">
        <q-bar style="background-color: #333333">
          <div>UP NEXT</div>
          <q-space />
          <q-btn dense flat icon="fa fa-info" class="q-pr-sm" @click="open(nextUp as Task)"/>
          <q-btn dense flat icon="fa fa-plus" class="q-pr-sm">
            <q-tooltip anchor="top middle" self="bottom middle" :offset="[7, 7]">
              Add Prerequisites
            </q-tooltip>
          </q-btn>
          <q-btn dense flat icon="fa fa-check" @click="useRepo(TaskRepo).toggleCompleted(nextUp as Task)"/>
        </q-bar>
        <q-card-section v-if="nextUp">
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
import { useQuasar } from 'quasar'
import { TDLAPP } from 'src/TDLAPP'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { computed } from 'vue'

const $q = useQuasar()
const open = (task: Task) => TDLAPP.openTask(task, $q)
const addTaskPre = (currentTask: Task) => TDLAPP.addPrerequisitesDialog(currentTask, $q)

const layerZero = computed(() => useRepo(TaskRepo).withAll().get().filter(x => !x.completed && x.grabPrereqs(true).length === 0).sort((a, b) => b.grabPostreqs(true).length - a.grabPostreqs(true).length))
const currentTask = computed(() => layerZero.value.length ? layerZero.value[0] : null)
const nextUp = computed(() => currentTask.value !== null ? [...layerZero.value, ...currentTask.value.grabPostreqs(true)].filter(x => x.id !== currentTask.value!.id).sort((a, b) => b.grabPostreqs(true).length - a.grabPostreqs(true).length)[0] : null)
</script>