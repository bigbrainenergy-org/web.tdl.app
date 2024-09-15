import { useRepo } from 'pinia-orm'
import { Task, TaskRepo } from '../tasks/task'
import { cachedTask, useAllTasksStore } from './all-tasks'
import { useCompletedTasksStore } from './completed-tasks'
import { useIncompleteTasksStore } from './incomplete-tasks'
import { useLayerZeroStore } from './layer-zero'
import { arrayDelete, arrayUpdate, venn } from 'src/utils/array-utils'
import { hardCheck } from 'src/utils/type-utils'

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
  static update = (task: Task) => {
    // todo: might need to rewrite.
    //
    const tr = useRepo(TaskRepo)
    tr.withAll().load([task])
    const newCachedTask = new cachedTask(task)
    const ats = useAllTasksStore()
    let currentTaskValue = ats.allTasks.get(task.id)
    if (typeof currentTaskValue === 'undefined') {
      ats.allTasks.set(newCachedTask.id, newCachedTask)
      currentTaskValue = newCachedTask
    }
    const vennPres = venn(currentTaskValue.hard_prereqs, newCachedTask.hard_prereqs)
    const vennPosts = venn(currentTaskValue.hard_postreqs, newCachedTask.hard_postreqs)
    console.debug({ vennPres, vennPosts })
    if (newCachedTask.completed) {
      useCompletedTasksStore().tasks.set(task.id, newCachedTask)
      useIncompleteTasksStore().tasks.delete(task.id)
    } else {
      useCompletedTasksStore().tasks.delete(task.id)
      useIncompleteTasksStore().tasks.set(task.id, newCachedTask)
    }
    ats.allTasks.set(newCachedTask.id, newCachedTask)
    const ATHardGet = (id: number): cachedTask => hardCheck(ats.typed.get(id))
    // left: tasks that have been removed from the dependencies
    // center: tasks whose state is unchanged
    // right: tasks that are being added to the dependencies
    vennPres.left.forEach((x) => {
      const t = ATHardGet(x.id)
      arrayDelete(t.hard_postreqs, task, 'id')
      console.log({ 'postreqs before delete': t.hard_postreq_ids})
      arrayDelete(t.hard_postreq_ids, task.id)
      console.log({ 'postreqs after delete': t.hard_postreq_ids})
    })
    vennPres.center.forEach((x) => {
      const t = ATHardGet(x.id)
      arrayUpdate(t.hard_postreqs, task, 'id')
    })
    vennPres.right.forEach((x) => {
      const t = ATHardGet(x.id)
      t.hard_postreqs.push(task)
      t.hard_postreq_ids.push(task.id)
    })
    vennPosts.left.forEach((x) => {
      const t = ATHardGet(x.id)
      arrayDelete(t.hard_prereqs, task, 'id')
      console.log({ 'prereqs before delete': t.hard_prereq_ids})
      arrayDelete(t.hard_prereq_ids, task.id)
      console.log({ 'prereqs after delete': t.hard_prereq_ids})
    })
    vennPosts.center.forEach((x) => {
      const t = ATHardGet(x.id)
      arrayUpdate(t.hard_prereqs, task, 'id')
    })
    vennPosts.right.forEach((x) => {
      const t = ATHardGet(x.id)
      t.hard_prereqs.push(task)
      t.hard_prereq_ids.push(task.id)
    })
    useLayerZeroStore().regenerate()
    return task
  }
  static checkAgainstKnownCompletedTasks(...tasks: Task[] | cachedTask[]) {
    const ct = useCompletedTasksStore().tasks
    tasks
      .filter((x) => ct.has(x.id))
      .map((x) => {
        console.warn(`COMPLETED TASK DETECTED: ${x.id} - ${x.title}`)
        throw new Error(`COMPLETED TASK DETECTED: ${x.id} - ${x.title}`)
      })
  }
  static delete(task: Task) {
    useAllTasksStore().allTasks.delete(task.id)
    useCompletedTasksStore().tasks.delete(task.id)
    useIncompleteTasksStore().tasks.delete(task.id)
  }
}
