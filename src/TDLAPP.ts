import { Dialog, Notify } from 'quasar'
import { useCurrentTaskStore } from './stores/task-meta/current-task'
import UpdateTaskDialog from './components/dialogs/UpdateTaskDialog.vue'
import UpdateProcedureDialog from './components/dialogs/UpdateProcedureDialog.vue'
import TaskSearchDialog from './components/dialogs/TaskSearchDialog.vue'
import { λ } from './types'
import TaskSlicerDialog from './components/dialogs/TaskSlicerDialog.vue'
import AddDependencyDialog from './components/dialogs/AddDependencyDialog.vue'
import { useLocalSettingsStore } from './stores/local-settings/local-setting'
import { useLoadingStateStore } from './stores/performance/loading-state'
import { Procedure } from './stores/procedures/procedure'
import { useTaskStore } from './stores/tasks/task-store'
import QuickSortLayerZeroDialog from './components/dialogs/QuickSortLayerZeroDialog.vue'
import { storeToRefs } from 'pinia'
import { Task } from './stores/tasks/task-model'

export class TDLAPP {
  static considerOpeningQuickSort = (src: string) => {
    const { disableQuickSort, enableQuickSortOnLayerZeroQTY, enableQuickSortOnNewTask } =
      useLocalSettingsStore()
    const { quickSortDialogActive } = storeToRefs(useLoadingStateStore())
    if (quickSortDialogActive.value) return
    if (disableQuickSort) return
    if (enableQuickSortOnLayerZeroQTY > 0) {
      const layerZeroQTY = useTaskStore().layerZero.length
      if (layerZeroQTY > enableQuickSortOnLayerZeroQTY) {
        this.openQuickSortDialog()
      }
      if (
        enableQuickSortOnNewTask &&
        useTaskStore().layerZero.filter((x) => x.incomplete_postreqs.length === 0).length > 0
      ) {
        this.openQuickSortDialog()
      }
    }
  }

  static openTask = (currentTask: number) => {
    const cts = useCurrentTaskStore()
    cts.id = currentTask
    return Dialog.create({ component: UpdateTaskDialog }).onDismiss(() => {
      this.considerOpeningQuickSort('openTask')
    })
  }
  static openProcedure = (procedure: Procedure) => {
    return Dialog.create({
      component: UpdateProcedureDialog,
      componentProps: {
        procedure
      }
    })
  }
  static openQuickSortDialog = () => {
    return Dialog.create({
      component: QuickSortLayerZeroDialog,
      componentProps: {
        objective: useLocalSettingsStore().enableQuickSortOnLayerZeroQTY
      }
    })
  }

  static searchDialog = (
    onSelect: (payload: { task: Task }) => void = (x: { task: Task }) => this.openTask(x.task.id),
    initialFilter?: λ<number | undefined, λ<Task[], Task[]>> | undefined
  ) => {
    return Dialog.create({
      component: TaskSearchDialog,
      componentProps: {
        dialogTitle: 'Search For A Task',
        taskID: undefined,
        showCreateButton: true,
        onSelect,
        closeOnSelect: true,
        initialFilter
      }
    })
  }
  static addPre = (task: Task, newPreID: number) => {
    return useTaskStore().addRule(newPreID, task.id)
  }
  static addPost = (task: Task, newPostID: number) => {
    useTaskStore().addRule(task.id, newPostID)
  }
  static addPrerequisitesDialog = (currentTask: Task) => {
    return Dialog.create({
      component: AddDependencyDialog,
      componentProps: {
        dialogTitle: 'Add Prerequisite',
        taskID: currentTask.id,
        showCreateButton: true,
        onSelect: (payload: { task: Task }) => {
          this.addPre(currentTask, payload.task.id)
        },
        initialFilter: (currentTaskID: number | undefined) => {
          if (typeof currentTaskID === 'undefined')
            throw new Error('Add Prerequisite: Current Task ID is undefined')
          const ct = useTaskStore().hardGet(currentTaskID)
          if (ct === null) throw new Error(`Add Prerequisite: Task ID ${currentTaskID} not found`)
          return (x: Task) => {
            if (x.completed) return false
            if (x.id === ct.id) return false
            if (ct.hard_prereq_ids.includes(x.id)) return false
            return true
          }
        },
        batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
          if (typeof taskID === 'undefined') return undefined
          const ct = useTaskStore().hardGet(taskID)
          if (ct === null) return undefined
          const relationInfo = ct.anyIDsBelow(tasks.map((x) => x.id))
          return tasks.filter((x) => relationInfo.get(x.id) !== true)
        }
      }
    })
  }
  static addPostrequisiteDialog = (currentTask: Task) => {
    return Dialog.create({
      component: AddDependencyDialog,
      componentProps: {
        dialogTitle: 'Add Postrequisite',
        taskID: currentTask.id,
        showCreateButton: true,
        onSelect: (payload: { task: Task }) => {
          this.addPost(currentTask, payload.task.id)
        },
        initialFilter: (currentTaskID: number | undefined) => {
          if (typeof currentTaskID === 'undefined')
            throw new Error('Add Postrequisite: Current Task ID is undefined')
          const ct = useTaskStore().hardGet(currentTaskID)
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
          const ct = useTaskStore().hardGet(taskID)
          if (ct === null) return undefined
          const relationInfo = ct.anyIDsAbove(tasks.map((x) => x.id))
          return tasks.filter((x) => relationInfo.get(x.id) !== true)
        }
      }
    })
  }
  static sliceTask = (task: Task) => {
    return Dialog.create({
      component: TaskSlicerDialog,
      componentProps: { task }
    })
  }
  static notifyUpdatedCompletionStatus: λ<Task, Task> = (task: Task) => {
    Notify.create({
      message: `Marked "${task.title}" ${task.completed ? 'Complete' : 'Incomplete'}`,
      color: 'positive',
      position: 'top',
      icon: 'fa-solid fa-check',
      actions: [
        {
          label: 'Undo',
          color: 'white',
          handler: () => {
            task.toggleCompleted()
          }
        }
      ],
      timeout: useLocalSettingsStore().notificationSpeed * 1500
    })
    return task
  }
  /**
   * Pass in a function and this will return a modified function that can pause heavy computed properties.
   * @param func the function that needs to be run while main computed properties are paused.
   * @returns the function that includes necessary blocking logic
   */
  static blockingFunc<T>(func: (x: T) => Promise<unknown>): (x: T) => Promise<unknown> {
    return async (x: T) => {
      useLoadingStateStore().busy = true
      await func(x)
      useLoadingStateStore().busy = false
    }
  }
}
