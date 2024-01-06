<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-actions>
            <q-toggle v-model="layerZeroOnly" @click="updateLocalSettings" label="Next Up Only" class="text-primary"/>
            <q-toggle v-model="incompleteOnly" @click="updateLocalSettings" label="Hide Completed Tasks" class="text-primary"/>
          </q-card-actions>
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-pain">Tasks</div>
                <div>{{ tasks.length }} Items</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-list class="text-primary">
              <q-intersection
                v-for="currentTask, index in tasks"
                :key="index"
                once
                style="min-height: 48px;"
              >
                <q-item
                  clickable
                  v-ripple
                  @click="openTask(currentTask)"
                >
                  <q-checkbox v-model:model-value="currentTask.completed" @update:model-value="updateTaskCompletedStatus(currentTask)" color="primary" keep-color></q-checkbox>
                
                  <q-item-section>
                    {{ currentTask.title }}
                  </q-item-section>

                  <q-item-section side v-if="currentTask.notes">
                    <q-icon name="description" class="q-ma-sm">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        Has additional notes! Click to view.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>

                  <q-item-section avatar v-if="currentTask.hard_postreq_ids.length">
                    <q-chip class="q-ma-md" :style="currentTask.hard_postreq_ids.length > 5 ? 'background-color: red;' : 'background-color: gray;'">{{ currentTask.hard_postreq_ids.length }}</q-chip>
                  </q-item-section>

                  <q-space></q-space>

                  <q-btn outline rounded label="ADD PRE" @click.stop="addTaskPre(currentTask)" v-if="!currentTask.completed"/>
                </q-item>
              </q-intersection>
              <template v-if="tasks.length === 0">
                <q-item clickable v-ripple>
                  <q-item-section>
                    <strong>Nothing yet!</strong>
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed, defineComponent, ref } from 'vue'

import UpdateTaskDialog from 'components/UpdateTaskDialog.vue'
import { useRepo } from 'pinia-orm';
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { Utils } from 'src/util'
import TaskSearchDialog from 'src/components/TaskSearchDialog.vue'
import { useCurrentTaskStore } from 'src/stores/task-meta/current-task'

const pageTasks = defineComponent({
  name: 'PageTasks',
})

const $q = useQuasar()
const tasksRepo = useRepo(TaskRepo)
const usr = useLocalSettingsStore()

const layerZeroOnly = ref(usr.layerZeroOnly)
const incompleteOnly = ref(usr.hideCompleted)
const updateLocalSettings = () => {
  usr.layerZeroOnly = layerZeroOnly.value
  usr.hideCompleted = incompleteOnly.value
}

const notCompleted = (x: Task) => x.completed === false
const notBlocked = (x: Task) => x.hard_prereq_ids.length === 0 || x.hard_prereqs.filter(notCompleted).length === 0

const tasks = computed(() => {
  let baseQuery = tasksRepo.withAll().get()
  if(layerZeroOnly.value) baseQuery = baseQuery.filter(notBlocked)
  if(incompleteOnly.value) baseQuery = baseQuery.filter(notCompleted)
  return baseQuery
})

const updateTaskCompletedStatus = async (task: Task) => {
  await tasksRepo.update({ id: Utils.hardCheck(task.id), payload: { task }})
}

// todo: restore this feature
//const taskMenus = ref([])
/*
This was the template info that took in taskMenus (it is unclear where taskMenus is getting its data, and Typescript is scared)
<q-menu context-menu auto-close :ref="el => { if(el) taskMenus[index] = el }">
  <q-list style="min-width: 100px">
    <q-item clickable @click="openTask(currentTask)">
      <q-item-section>Open</q-item-section>
      <q-item-section avatar>
        <q-icon name="fas fa-external-link-alt" />
      </q-item-section>
    </q-item>

    <q-separator />

    <q-item clickable>
      <q-item-section>Delete</q-item-section>
      <q-item-section avatar>
        <q-icon color="negative" name="fas fa-trash" />
      </q-item-section>
    </q-item>
  </q-list>
</q-menu>
This was between a "More Notes" tooltip and a template v-if="tasks.length === 0"
*/

const openTask = (currentTask: Task) => {
  const cts = useCurrentTaskStore()
  cts.id = currentTask.id
  console.debug(`opening UpdateTaskDialog with task of ${currentTask.title}`)
  $q.dialog({
    component: UpdateTaskDialog
  })
}

const addPrereq = async (task: Task, pre: Task) => {
  const payload_id = Utils.hardCheck(pre.id, 'addPrereq: id of prereq is null or undefined!')
  await tasksRepo.addPre(task, payload_id)
  .then(
    Utils.handleSuccess('Added Prerequisite', 'fa-solid fa-link'),
    // now comes the fun part though... the updateTaskDialog does
    // not show the prerequisites updated with the new value, and
    // the tasks page(s) do not update to show the new structure either.
    Utils.handleError('Failed to add prereq')
  )
}

const addTaskPre = (currentTask: Task) => {
  console.debug(`opening TaskSearchDialog with task of ${currentTask.title}`)
  $q.dialog({
    component: TaskSearchDialog,
    componentProps: {
      dialogTitle: 'Add Prerequisite',
      task: currentTask,
      onSelect: async (payload: { task: Task }) => {
        console.debug({payload})
        await addPrereq(currentTask, payload.task)
      }
    }
  })
}

const hoveredID = ref<number | null>(null)
const setHoveredTo = (x: number | null) => hoveredID.value = x
</script>
