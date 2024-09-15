import { Dialog } from 'quasar'
import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task'
import { addPost, addPre, createTask } from './task-utils'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { useCurrentTaskStore } from 'src/stores/task-meta/current-task'

import UpdateTaskDialog from 'src/components/dialogs/UpdateTaskDialog.vue'
import CreateTaskDialog from 'src/components/dialogs/CreateTaskDialog.vue'
import TaskSearchDialog from 'src/components/dialogs/TaskSearchDialog.vue'
import QuickSortLayerZeroDialog from 'src/components/dialogs/QuickSortLayerZeroDialog.vue'
import AddDependencyDialog from 'src/components/dialogs/AddDependencyDialog.vue'
import TaskSlicerDialog from 'src/components/dialogs/TaskSlicerDialog.vue'
import { useRepo } from 'pinia-orm'

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

export function addPrerequisitesDialog(currentTask: Task) {
  return Dialog.create({
    component: AddDependencyDialog,
    componentProps: {
      dialogTitle: 'Add Prerequisite',
      taskID: currentTask.id,
      showCreateButton: true,
      onSelect: async (payload: { task: Task }) => {
        await addPre(currentTask, payload.task.id)
      },
      initialFilter: (currentTaskID: number | undefined) => {
        if (typeof currentTaskID === 'undefined')
          throw new Error('Add Prerequisite: Current Task ID is undefined')
        const ct = useRepo(TaskRepo).withAll().find(currentTaskID)
        if (ct === null)
          throw new Error(`Add Prerequisite: Task not found with Task ID ${currentTaskID}`)
        return (x: Task) => {
          if (x.completed) return false
          if (x.id === ct.id) return false
          if (ct.hard_prereq_ids.includes(x.id)) return false
          return true
        }
      },
      batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
        if (typeof taskID === 'undefined') return undefined
        const ct = useRepo(TaskRepo).find(taskID)
        if (ct === null) return undefined
        const relationInfo = ct.anyIDsBelow(tasks.map((x) => x.id))
        return tasks.filter((x) => relationInfo.get(x.id) !== true)
      }
    }
  })
}

export function addPostrequisiteDialog(currentTask: Task) {
  return Dialog.create({
    component: AddDependencyDialog,
    componentProps: {
      dialogTitle: 'Add Postrequisite',
      taskID: currentTask.id,
      showCreateButton: true,
      onSelect: (payload: { task: Task }) => {
        addPost(currentTask, payload.task.id)
      },
      initialFilter: (currentTaskID: number | undefined) => {
        if (typeof currentTaskID === 'undefined')
          throw new Error('Add Postrequisite: Current Task ID is undefined')
        const ct = useRepo(TaskRepo).withAll().find(currentTaskID)
        if (ct === null)
          throw new Error(`Add Postrequisite: Task not found with Task ID ${currentTaskID}`)
        return (x: Task) => {
          if (x.completed) return false
          if (x.id === ct.id) return false
          if (ct.hard_postreq_ids.includes(x.id)) return false
          return true
        }
      },
      batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
        if (typeof taskID === 'undefined') return undefined
        const ct = useRepo(TaskRepo).find(taskID)
        if (ct === null) return undefined
        const relationInfo = ct.anyIDsAbove(tasks.map((x) => x.id))
        return tasks.filter((x) => relationInfo.get(x.id) !== true)
      }
    }
  })
}

export function openTaskSlicerDialog(task: Task) {
  return Dialog.create({
    component: TaskSlicerDialog,
    componentProps: { task }
  })
}
