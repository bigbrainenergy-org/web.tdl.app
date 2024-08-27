import { Dialog } from 'quasar'
import { CreateTaskOptions } from 'src/stores/tasks/task'
import { createTask } from './task-utils'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'

import CreateTaskDialog from 'src/components/dialogs/CreateTaskDialog.vue'
import TaskSearchDialog from 'src/components/dialogs/TaskSearchDialog.vue'
import QuickSortLayerZeroDialog from 'src/components/dialogs/QuickSortLayerZeroDialog.vue'

export function openCreateTaskDialog(onClose: () => void) {
  Dialog.create({
    component: CreateTaskDialog,
    componentProps: {
      onCreate: (payload: { options: CreateTaskOptions; callback: () => void }) => {
        const newTask = payload.options
        newTask.hard_prereq_ids = []
        newTask.hard_postreq_ids = []
        createTask(newTask)
        // REVIEW: Why do I call this in onCreate? I don't think it closes the dialog??
        if (typeof onClose === 'function') {
          onClose()
        }
      }
    }
  }).onDismiss(() => {
    if (typeof onClose === 'function') {
      onClose()
    }
  })
}

export function openSearchDialog(onClose: () => void) {
  Dialog.create({
    component: TaskSearchDialog,
    componentProps: {
      dialogTitle: 'Search For A Task',
      taskID: undefined,
      showCreateButton: true,
      closeOnSelect: true,
      initialFilter: [],
      batchFilter: []
    }
  }).onDismiss(() => {
    if (typeof onClose === 'function') {
      onClose()
    }
  })
}

// FIXME: Do not use state (pinia repos) directly on this util, jam it on the calling component like we do for the others
export function openQuickSortDialog() {
  if (useLoadingStateStore().quickSortDialogActive) return
  // todo fixme this is BAD.
  useLoadingStateStore().quickSortDialogActive = true
  console.log('OPENING QUICK SORT')
  Dialog.create({
    component: QuickSortLayerZeroDialog,
    componentProps: {
      objective: useLocalSettingsStore().enableQuickSortOnLayerZeroQTY
    }
  })
}
