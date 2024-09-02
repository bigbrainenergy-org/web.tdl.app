<template>
  <TaskPage :tasks="tasks">
    <TaskList :tasks="tasks" :unblocked-only="layerZeroOnly" :incomplete-only="hideCompleted"
      @task-completion-toggled="updateTaskCompletedStatus" @task-clicked="openTask" />
  </TaskPage>
</template>

<script setup lang="ts">
  import { useQuasar, useMeta } from 'quasar'
  import { computed, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useRepo } from 'pinia-orm'
  import { Task, TaskRepo } from 'src/stores/tasks/task'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { Utils } from 'src/util'
  import { TDLAPP } from 'src/TDLAPP'
  import QuickSortLayerZeroDialog from 'src/components/dialogs/QuickSortLayerZeroDialog.vue'
  import TaskList from 'src/components/TaskList.vue'
  import { useLayerZeroStore } from 'src/stores/performance/layer-zero'
  import TaskPage from 'src/components/TaskPage.vue'
  import { useTasks } from 'src/composables/use-tasks'

  useMeta(() => ({ title: 'List | TDL App' }))

  const $q = useQuasar()

  const openTask = (_event: any, task: Task) => TDLAPP.openTask(task)

  const { tasks } = useTasks()

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




  const tasksPageSettings = ref({
    'Unblocked Only': layerZeroOnly,
    'Incomplete Only': hideCompleted,
    'Auto Scale Priority': autoScalePriority
  })

  // const notCompleted = (x: Task) => x.completed === false

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
