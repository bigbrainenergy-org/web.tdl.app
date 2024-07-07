import { Collection, useRepo } from 'pinia-orm'
import { Task, TaskRepo } from '../tasks/task'
import { useAllTasksStore } from './all-tasks'
import { useCompletedTasksStore } from './completed-tasks'
import { useIncompleteTasksStore } from './incomplete-tasks'
import { Utils } from 'src/util'
import { useLayerZeroStore } from './layer-zero'

export class TaskCache {
  static regenerate = () => {
    const start = performance.now()
    const ats = useAllTasksStore()
    ats.regenerate()
    useCompletedTasksStore().regenerate()
    useIncompleteTasksStore().regenerate()
    useLayerZeroStore().regenerate()
    const duration = performance.now() - start
    if (duration > ats.allTasks.size / 2)
      console.warn(
        `Regenerating cache took longer than target of ${Math.floor(
          ats.allTasks.size / 2
        )}ms - it took ${Math.floor(duration)}ms`
      )
  }
  static update = (task: Task, retrieve = false) => {
    const tr = useRepo(TaskRepo)
    const loadAll = (x: Task) => tr.withAll().load([x])
    if (retrieve) loadAll(task)
    if (task.completed) {
      useCompletedTasksStore().completedTasks.set(task.id, task)
      useIncompleteTasksStore().incompleteTasks.delete(task.id)
    } else {
      useCompletedTasksStore().completedTasks.delete(task.id)
      useIncompleteTasksStore().incompleteTasks.set(task.id, task)
    }
    const ats = useAllTasksStore()
    const ATHardGet = (id: number) => Utils.hardCheck(ats.typed.get(id))
    if (typeof task.hard_prereqs === 'undefined') {
      task.hard_prereqs = task.hard_prereq_ids.map(ATHardGet)
      if (typeof task.hard_prereqs === 'undefined')
        throw new Error('Loading Task Hard Prereqs failed.')
      // else console.debug({ 'linked prereqs': task.hard_prereqs })
    }
    if (typeof task.hard_postreqs === 'undefined') {
      task.hard_postreqs = task.hard_postreq_ids.map(ATHardGet)
      if (typeof task.hard_postreqs === 'undefined')
        throw new Error('Loading Task Hard Postreqs failed.')
      // else console.debug({ 'linked postreqs': task.hard_postreqs })
    }
    let currentTaskValue = ats.allTasks.get(task.id)
    if (typeof currentTaskValue === 'undefined') {
      ats.allTasks.set(task.id, task)
      currentTaskValue = ats.allTasks.get(task.id)!
    }
    const vennPres = Utils.venn(currentTaskValue.hard_prereqs, task.hard_prereqs)
    const vennPosts = Utils.venn(currentTaskValue.hard_postreqs, task.hard_postreqs)
    // console.debug({ vennPres, vennPosts })
    // left: tasks that have been removed from the dependencies
    // center: tasks whose state is unchanged
    // right: tasks that are being added to the dependencies
    vennPres.left.forEach((x) => {
      const t = ATHardGet(x.id)
      // todo: make custom array class
      Utils.arrayDelete(t.hard_postreqs, currentTaskValue)
      // todo: will this be necessary, or is t a reference to the value in the Map?
      ats.allTasks.set(t.id, t)
    })
    vennPres.center.forEach((x) => {
      const t = ATHardGet(x.id)
      // todo: make custom array class
      try {
        Utils.arrayUpdate(t.hard_postreqs, task, 'id')
      } catch(error) {
        console.warn(error)
        throw error
      }
      // todo: will this be necessary, or is t a reference to the value in the Map?
      ats.allTasks.set(t.id, t)
    })
    vennPres.right.forEach((x) => {
      const t = ATHardGet(x.id)
      t.hard_postreqs.push(task)
      // todo: will this be necessary, or is t a reference to the value in the Map?
      ats.allTasks.set(t.id, t)
    })
    vennPosts.left.forEach((x) => {
      const t = ATHardGet(x.id)
      // todo: make custom array class
      Utils.arrayDelete(t.hard_prereqs, currentTaskValue)
      // todo: will this be necessary, or is t a reference to the value in the Map?
      ats.allTasks.set(t.id, t)
    })
    vennPosts.center.forEach((x) => {
      const t = ATHardGet(x.id)
      // todo: make custom array class
      try {
        Utils.arrayUpdate(t.hard_prereqs, task, 'id')
      } catch(error) {
        console.warn(error)
        throw error
      }
      // todo: will this be necessary, or is t a reference to the value in the Map?
      ats.allTasks.set(t.id, t)
    })
    vennPosts.right.forEach((x) => {
      const t = ATHardGet(x.id)
      t.hard_prereqs.push(task)
      // todo: will this be necessary, or is t a reference to the value in the Map?
      ats.allTasks.set(t.id, t)
    })
    // completed tasks and incomplete tasks stores will be up-to-date based on the logic above.
    useLayerZeroStore().regenerate()
    return task
  }
  static checkAgainstKnownCompletedTasks(...tasks: Task[]) {
    const ct = useCompletedTasksStore().completedTasks
    tasks.filter(x => ct.has(x.id)).map(x => console.warn(`COMPLETED TASK DETECTED: ${x.title}`))
  }
  static delete(task: Task) {
    useAllTasksStore().allTasks.delete(task.id)
    useCompletedTasksStore().completedTasks.delete(task.id)
    useIncompleteTasksStore().incompleteTasks.delete(task.id)
    const lzs = useLayerZeroStore()
    const t_index = lzs.layerZero.findIndex(x => x.id === task.id)
    if(t_index >= 0) lzs.layerZero.splice(t_index, 1)
  }
  static get layerZero() {
    return useLayerZeroStore().layerZero as Task[]
  }
}