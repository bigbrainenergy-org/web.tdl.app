import { Dialog } from 'quasar'
import { CreateTaskOptions } from 'src/stores/tasks/task'
import CreateTaskDialog from 'src/components/dialogs/CreateTaskDialog.vue'
import TaskSearchDialog from 'src/components/dialogs/TaskSearchDialog.vue'
import { createTask } from './task-utils'

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
        if (onClose) {
          onClose()
        }
      }
    }
  }).onDismiss(() => {
    if (onClose) {
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
    if (onClose) {
      onClose()
    }
  })
}
