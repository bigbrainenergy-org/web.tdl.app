<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section>
            <q-list class="text-primary">
              <q-intersection v-for="(currentTask, index) in tasks" :key="index" once style="min-height: 48px">
                <q-item v-ripple clickable @click="open(currentTask)">
                  <q-checkbox v-model:model-value="currentTask.completed" color="primary" keep-color
                    @update:model-value="updateTaskCompletedStatus(currentTask)" />

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

                  <q-item-section v-if="currentTask.grabPostreqs(hideCompleted).length" side>
                    <q-chip v-if="currentTask.grabPostreqs(hideCompleted).length" :style="currentTask.grabPostreqs(hideCompleted).length > postreqQuantityWarningThreshold
                      ? 'background-color: red;'
                      : 'background-color: gray;'
                      ">
                      {{ currentTask.grabPostreqs(hideCompleted).length }}
                    </q-chip>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn v-if="!currentTask.completed" outline rounded label="ADD PRE"
                      @click.stop="addTaskPre(currentTask)" />
                  </q-item-section>
                </q-item>
              </q-intersection>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
  import { useMeta, useQuasar } from 'quasar'
  import { computed, ref } from 'vue'

  import { useRepo } from 'pinia-orm'
  import { Task, TaskRepo } from 'src/stores/tasks/task'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { Utils, exists } from 'src/util'
  import { TDLAPP } from 'src/TDLAPP'
  import SettingsButton from 'src/components/SettingsButton.vue'
  import QuickSortLayerZeroDialog from 'src/components/dialogs/QuickSortLayerZeroDialog.vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { storeToRefs } from 'pinia'
  import { TaskCache } from 'src/stores/performance/task-go-fast'
  import { useLayerZeroStore } from 'src/stores/performance/layer-zero'
  import { openQuickSortDialog, openSearchDialog } from 'src/utils/dialog-utils'

  const $q = useQuasar()

  const open = (task: Task) => TDLAPP.openTask(task)

  const tasksRepo = useRepo(TaskRepo)

  const localSettingsStore = useLocalSettingsStore()

  const { layerZeroOnly, hideCompleted, disableQuickSort, enableQuickSortOnLayerZeroQTY, autoScalePriority } =
    storeToRefs(localSettingsStore)

  const tasksPageSettings = ref({
    'Unblocked Only': layerZeroOnly,
    'Incomplete Only': hideCompleted,
    'Auto Scale Priority': autoScalePriority
  })

  const notCompleted = (x: Task) => x.completed === false
  const notBlocked = (x: Task) => x.hard_prereqs.filter(notCompleted).length === 0
  const qtyPostreqsSort = (a: Task, b: Task) =>
    b.grabPostreqs(hideCompleted.value).length - a.grabPostreqs(hideCompleted.value).length

  const tasks = computed(() => {
    const { busy, quickSortDialogActive } = useLoadingStateStore()
    if (busy) {
      console.log('busy signal; skipping agenda recalc.')
      return []
    }
    if (quickSortDialogActive) {
      console.log('quick sort dialog is active; skipping agenda recalc')
      return []
    }
    console.log('recalculating agenda.')
    // todo: think about why using the incompleteTasksStore and refactoring to use cachedTask slows this down...
    // maybe because the cache gets rattled while loading the page.
    // perhaps using the cache, there would be an entirely easier way to get this done?
    const allIncompleteTasks = useRepo(TaskRepo).where('completed', false).withAll().get()
    TaskCache.checkAgainstKnownCompletedTasks(...allIncompleteTasks)
    let baseMap = new Map(allIncompleteTasks.map((x) => [x.id, x]))
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
        TaskCache.checkAgainstKnownCompletedTasks(...finalList)
        return finalList
      }
      finalList.push(layer.get(nextUp.id)!)
      layer.delete(nextUp.id)
      traversed.add(nextUp.id)
    }
    TaskCache.checkAgainstKnownCompletedTasks(...finalList)
    return finalList
  })

  const updateTaskCompletedStatus = async (task: Task) => {
    const newStatus = task.completed
    await tasksRepo.updateAndCache({ id: task.id, payload: { task } }).then((result) => {
      if (result.completed !== newStatus) throw new Error('error saving completed status of task')
      // useAllTasksStore().completion(task.id, newStatus)
      TDLAPP.notifyUpdatedCompletionStatus(result)
      console.debug({ 'Agenda updateTaskCompletedStatus task result': result })
    }, Utils.handleError('Error updating completion status of a task.'))
  }

  const addTaskPre = (currentTask: Task) => TDLAPP.addPrerequisitesDialog(currentTask)
  useMeta(() => ({ title: 'Agenda | TDL App' }))
</script>
