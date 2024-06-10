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
            <q-btn
              icon="fa-solid fa-signs-post"
              class="text-primary"
              @click="openQuickSortDialog"
            />
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
                v-for="(currentTask, index) in tasks"
                :key="index"
                once
                style="min-height: 48px"
              >
                <q-item v-ripple clickable @click="open(currentTask)">
                  <q-checkbox
                    v-model:model-value="currentTask.completed"
                    color="primary"
                    keep-color
                    @update:model-value="updateTaskCompletedStatus(currentTask)"
                  />

                  <q-item-section>
                    <q-item-label lines="2">
                      {{ currentTask.title }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section v-if="currentTask.notes" side>
                    <q-avatar icon="description">
                      <q-tooltip anchor="center right" self="center left" :offset="[10, 10]">
                        Has additional notes! Click to view.
                      </q-tooltip>
                    </q-avatar>
                  </q-item-section>

                  <q-item-section v-if="currentTask.grabPostreqs(incompleteOnly).length" side>
                    <q-chip
                      v-if="currentTask.grabPostreqs(incompleteOnly).length"
                      :style="
                        currentTask.grabPostreqs(incompleteOnly).length > sortQty
                          ? 'background-color: red;'
                          : 'background-color: gray;'
                      "
                    >
                      {{ currentTask.grabPostreqs(incompleteOnly).length }}
                    </q-chip>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      v-if="!currentTask.completed"
                      outline
                      rounded
                      label="ADD PRE"
                      @click.stop="addTaskPre(currentTask)"
                    />
                  </q-item-section>
                </q-item>
              </q-intersection>
              <template v-if="tasks.length === 0">
                <q-item v-ripple clickable>
                  <q-item-section v-if="useLoadingStateStore().busy">
                    <strong>Loading...</strong>
                  </q-item-section>
                  <q-item-section v-else>
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

import { useRepo } from 'pinia-orm'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { Utils, computedWithPrev, exists } from 'src/util'
import { TDLAPP } from 'src/TDLAPP'
import SettingsButton from 'src/components/SettingsButton.vue'
import QuickSortLayerZeroDialog from 'src/components/dialog/QuickSortLayerZeroDialog.vue'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { useLayerZeroStore } from 'src/stores/performance/layer-zero'
import { useAllTasksStore } from 'src/stores/performance/all-tasks'

const $q = useQuasar()

const open = (task: Task) => TDLAPP.openTask(task)

const pageTasks = defineComponent({
  name: 'PageTasks'
})
const tasksRepo = useRepo(TaskRepo)
const usr = useLocalSettingsStore()

const layerZeroOnly = ref(usr.layerZeroOnly)
const incompleteOnly = ref(usr.hideCompleted)
const sortQty = computed(() => {
  const len0 = useLayerZeroStore().get().length
  if (usr.disableQuickSort) return len0
  return Math.max(1, usr.enableQuickSortOnLayerZeroQTY - len0)
})

const tasksPageSettings = ref({
  'Unblocked Only': layerZeroOnly,
  'Incomplete Only': incompleteOnly
})

watch(layerZeroOnly, () => {
  usr.layerZeroOnly = layerZeroOnly.value
})

watch(incompleteOnly, () => {
  usr.hideCompleted = incompleteOnly.value
})

const notCompleted = (x: Task) => x.completed === false
const notBlocked = (x: Task) =>
  x.hard_prereq_ids.length === 0 || x.hard_prereqs.filter(notCompleted).length === 0
const qtyPostreqsSort = (a: Task, b: Task) =>
  b.grabPostreqs(incompleteOnly.value).length - a.grabPostreqs(incompleteOnly.value).length

const tasks = computed(() => {
  if (useLoadingStateStore().busy || useLoadingStateStore().quickSortDialogActive) {
    if (useLoadingStateStore().quickSortDialogActive)
      console.log('quick sort dialog active is TRUE, so skipping agenda recalc')
    if (useLoadingStateStore().busy) console.log('busy signal is TRUE, so skipping agenda recalc')
    return []
  }
  console.log('recalculating agenda.')
  let baseMap = new Map(
    useRepo(TaskRepo)
      .where('completed', false)
      .withAll()
      .get()
      .map((x) => [x.id, x])
  )
  let traversed = new Set<number>() // ids
  let finalList: Array<Task> = []
  const notBlockedByTraversed = (k: number, x: Task) =>
    x.hard_prereqs.filter(notCompleted).every((y) => traversed.has(y.id))
  const filterMap = <K, V>(
    map: Map<K, V>,
    result: Map<K, V>,
    predicate: (key: K, value: V) => boolean
  ) => {
    for (let [key, value] of map) {
      if (predicate(key, value)) {
        // could find the task with the most qty incomplete postreqs here and save a few cycles.
        result.set(key, value)
        map.delete(key)
      }
    }
  }
  let layer = new Map<number, Task>()
  while (baseMap.size || layer.size) {
    // console.debug({ size: baseMap.size, traversed: traversed.size, layer: layer.size })
    if (baseMap.size) filterMap<number, Task>(baseMap, layer, notBlockedByTraversed)
    let nextUp: { id?: number; p: number } = { p: 0 }
    // todo: SortedMap? That a thing?
    layer.forEach((val: Task, key: number) => {
      const p = val.hard_postreqs.filter(notCompleted).length
      if (p > nextUp.p) {
        nextUp.id = key
        nextUp.p = p
      } else if (p === nextUp.p) {
        if (!exists(nextUp.id)) {
          nextUp.id = key
          nextUp.p = p
        } else {
          // todo: maybe change this to sum the qty postreqs of postreqs - i.e. use withAllRecursive for the baseMap
          if (nextUp.id > key) {
            nextUp.id = key
            nextUp.p = p
          }
        }
      }
    })
    if (typeof nextUp.id === 'undefined') {
      console.debug(`pushing remaining ${layer.size} tasks to list`)
      finalList.push(...layer.values())
      return finalList
    }
    finalList.push(layer.get(nextUp.id)!)
    layer.delete(nextUp.id)
    traversed.add(nextUp.id)
  }
  return finalList
})

const updateTaskCompletedStatus = async (task: Task) => {
  await tasksRepo
    .updateAndCache({ id: task.id, payload: { task } })
    .then(
      TDLAPP.notifyUpdatedCompletionStatus(task),
      Utils.handleError('Error updating completion status of a task.')
    )
}

const addTaskPre = (currentTask: Task) => TDLAPP.addPrerequisitesDialog(currentTask)
const openSearchDialog = () => TDLAPP.searchDialog()

const openQuickSortDialog = () => $q.dialog({ component: QuickSortLayerZeroDialog })
</script>
