<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-actions>
            <SettingsButton v-model:settings="tasksPageSettings" name="Tasks Page Settings" />
            <q-space />
            <q-item-label class="text-primary">{{ tasks.length }} tasks</q-item-label>
            <q-space />
            <q-btn icon="fa-solid fa-signs-post" class="text-primary" @click="openQuickSortDialog" />
            <q-btn icon="fa-solid fa-search" class="text-primary" @click="openSearchDialog" />
          </q-card-actions>
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-pain">Tasks</div>
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
                  v-ripple
                  clickable
                  @click="open(currentTask)"
                >
                  <q-checkbox
                    v-model:model-value="currentTask.completed"
                    color="primary"
                    keep-color
                    @update:model-value="updateTaskCompletedStatus(currentTask)" />

                  <q-item-section>
                    {{ currentTask.title }}
                  </q-item-section>

                  <q-item-section v-if="currentTask.notes" side>
                    <q-avatar icon="description">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]">
                        Has additional notes! Click to view.
                      </q-tooltip>
                    </q-avatar>
                  </q-item-section>

                  <q-item-section v-if="currentTask.grabPostreqs(incompleteOnly).length" side>
                    <q-chip
                    v-if="currentTask.grabPostreqs(incompleteOnly).length"
                    :style="currentTask.grabPostreqs(incompleteOnly).length > 5 ? 'background-color: red;' : 'background-color: gray;'">
                      {{ currentTask.grabPostreqs(incompleteOnly).length }}
                    </q-chip>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn v-if="!currentTask.completed" outline rounded label="ADD PRE" @click.stop="addTaskPre(currentTask)" />
                  </q-item-section>

                </q-item>
              </q-intersection>
              <template v-if="tasks.length === 0">
                <q-item v-ripple clickable>
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
import { computed, defineComponent, ref, watch } from 'vue'

import { useRepo } from 'pinia-orm';
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { Utils } from 'src/util'
import { TDLAPP } from 'src/TDLAPP'
import SettingsButton from 'src/components/SettingsButton.vue'
import QuickSortLayerZeroDialog from 'src/components/dialog/QuickSortLayerZeroDialog.vue'

const $q = useQuasar()

const open = (task: Task) => TDLAPP.openTask(task)

const pageTasks = defineComponent({
  name: 'PageTasks',
})
const tasksRepo = useRepo(TaskRepo)
const usr = useLocalSettingsStore()

const layerZeroOnly = ref(usr.layerZeroOnly)
const incompleteOnly = ref(usr.hideCompleted)

const tasksPageSettings = ref({ 'Unblocked Only': layerZeroOnly, 'Incomplete Only': incompleteOnly })

watch(layerZeroOnly, () => {
  usr.layerZeroOnly = layerZeroOnly.value
})

watch(incompleteOnly, () => {
  usr.hideCompleted = incompleteOnly.value
})

const notCompleted = (x: Task) => x.completed === false
const notBlocked = (x: Task) => x.hard_prereq_ids.length === 0 || x.hard_prereqs.filter(notCompleted).length === 0

const tasks = computed(() => {
  let baseQuery = useRepo(TaskRepo).withAll().get()
  if(layerZeroOnly.value) baseQuery = baseQuery.filter(notBlocked)
  if(incompleteOnly.value) baseQuery = baseQuery.filter(notCompleted)
  return baseQuery.sort((a, b) => b.grabPostreqs(incompleteOnly.value).length - a.grabPostreqs(incompleteOnly.value).length)
})

const updateTaskCompletedStatus = async (task: Task) => {
  await tasksRepo.update({ id: task.id, payload: { task }})
  .then(
    TDLAPP.notifyUpdatedCompletionStatus(task),
    Utils.handleError('Error updating completion status of a task.')
  )
}

const addTaskPre = (currentTask: Task) => TDLAPP.addPrerequisitesDialog(currentTask)
const openSearchDialog = () => TDLAPP.searchDialog()

const openQuickSortDialog = () => $q.dialog({
  component: QuickSortLayerZeroDialog
})
</script>
