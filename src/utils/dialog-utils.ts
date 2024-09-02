import { Dialog } from 'quasar'
import { CreateTaskOptions, Task } from 'src/stores/tasks/task'
import { createTask } from './task-utils'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { useCurrentTaskStore } from 'src/stores/task-meta/current-task'

import UpdateTaskDialog from 'src/components/dialogs/UpdateTaskDialog.vue'
import CreateTaskDialog from 'src/components/dialogs/CreateTaskDialog.vue'
import TaskSearchDialog from 'src/components/dialogs/TaskSearchDialog.vue'
import QuickSortLayerZeroDialog from 'src/components/dialogs/QuickSortLayerZeroDialog.vue'

export function openCreateTaskDialog() {
  return Dialog.create({
    component: CreateTaskDialog,
    componentProps: {
      onCreate: (payload: { options: CreateTaskOptions; callback: () => void }) => {
        const newTask = payload.options
        newTask.hard_prereq_ids = []
        newTask.hard_postreq_ids = []
        createTask(newTask)
      }
    }
  })
}

export function openSearchDialog() {
  return Dialog.create({
    component: TaskSearchDialog,
    componentProps: {
      dialogTitle: 'Search For A Task',
      taskID: undefined,
      showCreateButton: true,
      closeOnSelect: true
    }
  })
}

// FIXME: Do not use state (pinia repos) directly on this util, jam it on the calling component like we do for the others
export function openQuickSortDialog() {
  if (useLoadingStateStore().quickSortDialogActive) return
  // todo fixme this is BAD.
  useLoadingStateStore().quickSortDialogActive = true
  console.log('OPENING QUICK SORT')
  return Dialog.create({
    component: QuickSortLayerZeroDialog,
    componentProps: {
      objective: useLocalSettingsStore().enableQuickSortOnLayerZeroQTY
    }
  })
}

export function openUpdateTaskDialog(currentTask: Task | number) {
  const cts = useCurrentTaskStore()
  if (currentTask instanceof Task) {
    cts.id = currentTask.id
  } else {
    cts.id = currentTask
  }
  return Dialog.create({ component: UpdateTaskDialog })
}
