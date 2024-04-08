import { Dialog, Notify } from 'quasar'
import { Task, TaskRepo } from './stores/tasks/task'
import { Utils } from './util'
import { useCurrentTaskStore } from './stores/task-meta/current-task'
import UpdateTaskDialog from './components/dialog/UpdateTaskDialog.vue'
import TaskSearchDialog from './components/dialog/TaskSearchDialog.vue'
import { useRepo } from 'pinia-orm'
import { λ } from './types'
import TaskSlicerDialog from './components/dialog/TaskSlicerDialog.vue'

export class TDLAPP {
  static openTask = (currentTask: Task | number) => {
    const cts = useCurrentTaskStore()
    let msg: string
    if(currentTask instanceof Task) {
      cts.id = currentTask.id
      msg = `opening UpdateTaskDialog with task of ${currentTask.title}`
    }
    else {
      cts.id = currentTask
      msg = `opening UpdateTaskDialog with task ID ${currentTask}`
    }
    return Dialog.create({
      component: UpdateTaskDialog
    })
  }
  static searchDialog = (onSelect: (payload: { task: Task }) => void = (x: { task: Task }) => this.openTask(x.task)) => {
    return Dialog.create({
      component: TaskSearchDialog,
      componentProps: {
        dialogTitle: 'Search For A Task',
        taskID: undefined,
        showCreateButton: true,
        onSelect,
        closeOnSelect: true
      }
    })
  }
  static addPre = async (task: Task, newPreID: number) => {
    await useRepo(TaskRepo).addPre(task, newPreID)
    .then(
      Utils.handleSuccess('Added Prerequisite', 'fa-solid fa-link'),
      Utils.handleError('Failed to add prereq'))
  }
  static addPost = async (task: Task, newPostID: number) => {
    await useRepo(TaskRepo).addPost(task, newPostID)
    .then(
      Utils.handleSuccess('Added Postrequisite', 'fa-solid fa-link'),
      Utils.handleError('Failed to add postreq')
    )
  }
  static addPrerequisitesDialog = (currentTask: Task) => {
    return Dialog.create({
      component: TaskSearchDialog,
      componentProps: {
        dialogTitle: 'Add Prerequisite',
        taskID: currentTask.id,
        showCreateButton: true,
        onSelect: async (payload: { task: Task }) => {
          await this.addPre(currentTask, payload.task.id)
        },
        initialFilter: (currentTaskID: number | undefined) => {
          if(typeof currentTaskID === 'undefined') throw new Error('Add Prerequisite: Current Task ID is undefined')
          const ct = useRepo(TaskRepo).withAll().find(currentTaskID)
          if(ct === null) throw new Error(`Add Prerequisite: Task not found with Task ID ${currentTaskID}`)
          return (x: Task) => {
            if(x.completed) return false
            if(ct.hard_prereq_ids.includes(x.id)) return false
            return true
          }
        },
        batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
          if(typeof taskID === 'undefined') return undefined
          const ct = useRepo(TaskRepo).find(taskID)
          if(ct === null) return undefined
          const relationInfo = ct.anyIDsBelow(tasks.map(x => x.id))
          return tasks.filter(x => relationInfo.get(x.id) !== true)
        }
      }
    })
  }
  static addPostrequisiteDialog = (currentTask: Task) => {
    return Dialog.create({
      component: TaskSearchDialog,
      componentProps: {
        dialogTitle: 'Add Postrequisite',
        taskID: currentTask.id,
        showCreateButton: true,
        onSelect: (payload: { task: Task }) => {
          this.addPost(currentTask, payload.task.id)
        },
        batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
          if(typeof taskID === 'undefined') return undefined
          const ct = useRepo(TaskRepo).find(taskID)
          if(ct === null) return undefined
          const relationInfo = ct.anyIDsAbove(tasks.map(x => x.id))
          return tasks.filter(x => relationInfo.get(x.id) !== true)
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
  static notifyUpdatedCompletionStatus: λ<Task, λ> = (task: Task) => () => {
    console.log(`notifyUpdatedCompletionStatus: task is ${task.completed ? 'completed' : 'incomplete'}`)
    Notify.create({
      message: `Marked "${ task.title }" ${ task.completed ? 'Complete' : 'Incomplete'}`,
      color: 'positive',
      position: 'top',
      icon: 'fa-solid fa-check',
      actions: [
        { label: 'Undo', color: 'white', handler: () => { task.toggleCompleted() } }
      ]
    })
  }
}