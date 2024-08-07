<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-actions>
            <SettingsButton v-model:settings="tasksPageSettings" />
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
                <div class="text-h6 text-pain" data-cy="tasks_title">Tasks</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <TaskList
              :tasks="tasks"
              :unblocked-only="layerZeroOnly"
              :incomplete-only="hideCompleted"
              @task-completion-toggled="updateTaskCompletedStatus"
              @task-clicked="openTask"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
  import { useQuasar, useMeta } from 'quasar'
  import { computed, defineComponent, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useRepo } from 'pinia-orm'
  import { Task, TaskRepo } from 'src/stores/tasks/task'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { Utils } from 'src/util'
  import { TDLAPP } from 'src/TDLAPP'
  import QuickSortLayerZeroDialog from 'src/components/dialogs/QuickSortLayerZeroDialog.vue'
  import SettingsButton from 'src/components/SettingsButton.vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import TaskList from 'src/components/TaskList.vue'
  import { cachedTask, useAllTasksStore } from 'src/stores/performance/all-tasks'
  import { useLayerZeroStore } from 'src/stores/performance/layer-zero'

  useMeta(() => {
    return {
      title: 'Tasks | TDL App'
    }
  })

  const $q = useQuasar()

  const openTask = (_event: any, task: Task) => TDLAPP.openTask(task)

  const pageTasks = defineComponent({
    name: 'PageTasks'
  })
  const tasksRepo = useRepo(TaskRepo)
  const localSettingsStore = useLocalSettingsStore()
  const {
    layerZeroOnly,
    hideCompleted,
    selectedList,
    disableQuickSort,
    enableQuickSortOnLayerZeroQTY,
    autoScalePriority
  } = storeToRefs(localSettingsStore)

  const loadingStateStore = useLoadingStateStore()
  const { busy } = storeToRefs(loadingStateStore)

  const tasksPageSettings = ref({
    'Unblocked Only': layerZeroOnly,
    'Incomplete Only': hideCompleted,
    'Auto Scale Priority': autoScalePriority
  })

  // const notCompleted = (x: Task) => x.completed === false

  const tasks = computed(() => {
    if (busy.value) return []
    console.debug('updating tasks on Task page')
    let baseQuery = useLayerZeroStore().typed
    console.debug({ baseQuery })
    const filterByList = (x: cachedTask) => x.t.list?.title === selectedList.value
    if (selectedList.value) baseQuery = baseQuery.filter(filterByList)
    const postreqs = hideCompleted.value
      ? (t: cachedTask) => t.hard_postreqs.filter((x) => !x.completed)
      : (t: cachedTask) => t.hard_postreqs
    baseQuery.sort((a, b) => postreqs(b).length - postreqs(a).length)
    return baseQuery
  })

  const updateTaskCompletedStatus = async (task: Task) => {
    const newStatus = task.completed
    // TODO: strip payload object of everything except necessary
    await tasksRepo.updateAndCache({ id: task.id, payload: { task } }).then((t) => {
      // console.debug({ 'Tasks updateTaskCompletedStatus': t })
      if (t.completed !== newStatus)
        throw new Error('updated value and value meant to update do not match')
      TDLAPP.notifyUpdatedCompletionStatus(task)
    }, Utils.handleError('Error updating completion status of a task.'))
  }

  const openSearchDialog = () => TDLAPP.searchDialog()

  const openQuickSortDialog = () =>
    $q.dialog({
      component: QuickSortLayerZeroDialog
    })

  const autoThreshold = computed(() => {
    const sampleSize = Math.min(tasks.value.length, 10)
    let sumPriorities = 0
    for (let i = 0; i < sampleSize; i++) {
      sumPriorities += tasks.value[i].hard_postreqs.filter((x) => !x.completed).length
    }
    return Math.floor(sumPriorities / sampleSize)
  })

  const sortQty = computed(() => {
    const len0 = useLayerZeroStore().tasks.length
    if (disableQuickSort.value) return len0
    return autoScalePriority.value
      ? autoThreshold.value
      : Math.max(1, enableQuickSortOnLayerZeroQTY.value - len0)
  })
</script>
