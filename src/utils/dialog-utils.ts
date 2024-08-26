import { Dialog } from 'quasar'
import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task'
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
        onClose() // REVIEW: Why do I call this on create? I don't think it closes the dialog??
      }
    }
  }).onDismiss(() => {
    onClose()
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
    onClose()
  })
}
