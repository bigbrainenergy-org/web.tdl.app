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
          <q-btn dense flat icon="fa fa-plus" class="q-pr-sm">
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
import { useQuasar } from 'quasar'
import { TDLAPP } from 'src/TDLAPP'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { computed } from 'vue'

const $q = useQuasar()
const open = (task: Task) => TDLAPP.openTask(task, $q)
const addTaskPre = (currentTask: Task) => TDLAPP.addPrerequisitesDialog(currentTask, $q)

const layerZero = computed(() => {
  const incomplete = (x: Task) => !x.completed
  const tr = useRepo(TaskRepo)
  let lzero = tr.withAll().get()
  lzero = lzero.filter(x => !x.completed)
  lzero = lzero.filter(x => !x.hard_prereqs.some(y => !y.completed))
  lzero.sort((a, b) => b.hard_postreqs.filter(incomplete).length - a.hard_postreqs.filter(incomplete).length)
  return lzero
})

const currentTask = computed(() => layerZero.value.length ? layerZero.value[0] : null)
const nextUp = computed(() => {
  let arr: Array<Task> = Array.from(layerZero.value)
  console.debug({ 'arr just layer zero': arr })
  if(currentTask.value !== null) {
    let posts = currentTask.value.grabPostreqs(true)
    console.log({ 'posts of current task': posts })
    console.log('pres of posts', posts.map(x => ({ post: x, pres: x.grabPrereqs(true)})))
    posts = posts.filter(x => x.grabPrereqs(true).length === 1)
    console.log({ 'posts that have 1 or 0 prereqs': posts })
    arr.push(...posts)
    console.debug({ 'arr with current task postreqs added': arr })
    arr = arr.filter(x => x.id !== currentTask.value!.id)
    console.debug({ 'arr after current task is filtered out': arr, currentTask: currentTask.value })
  }
  arr.sort((a, b) => b.grabPostreqs(true).length - a.grabPostreqs(true).length)
  
  console.log(arr)
  return arr.length > 0 ? arr[0] : null
})
</script>