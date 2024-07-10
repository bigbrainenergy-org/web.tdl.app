// import { defineStore } from 'pinia'
// import { Task, TaskRepo } from '../tasks/task'
// import { useRepo } from 'pinia-orm'
// import { Utils } from 'src/util'
// interface TasksCacheStoreState {
//   incompleteTasks: Map<number, Task>
//   completedTasks: Map<number, Task>
// }
// const generate = (): TasksCacheStoreState => {
//   const start = performance.now()
//   const allTasksArray = useRepo(TaskRepo).withAll().get() as Task[]
//   const taskmap = (x: Task[]): Map<number, Task> => new Map<number, Task>(x.map(y => [y.id, y]))
//   const allTasks = taskmap(allTasksArray)
//   const completed = (x: Task) => x.completed
//   const incomplete = (x: Task) => !x.completed
//   const incompleteTasksArray = allTasksArray.filter(incomplete)
//   const completedTasks  = taskmap(allTasksArray.filter(completed))
//   const incompleteTasks = taskmap(incompleteTasksArray)
//   const duration = performance.now() - start
//   if (duration > allTasks.size / 2)
//     console.warn(
//       `Regenerating cache took longer than target of ${Math.floor(
//         allTasks.size / 2
//       )}ms - it took ${Math.floor(duration)}ms`
//     )
//   return { allTasks, incompleteTasks, completedTasks }
// }
// export const useTasksCache = defineStore('TasksCache', {
//   state: generate,
//   persist: false,
//   actions: {
//     get(id: number) { return this.allTasks.get(id) },
//     regenerate() { generate() },
//     update(task: Task, retrieve = false) {
//       const tr = useRepo(TaskRepo)
//       const loadAll = (x: Task) => tr.withAll().load([x])
//       if (retrieve) loadAll(task)
//       if (task.completed) {
//         this.completedTasks.set(task.id, task)
//         this.incompleteTasks.delete(task.id)
//       } else {
//         this.completedTasks.delete(task.id)
//         this.incompleteTasks.set(task.id, task)
//       }
//       if (typeof task.hard_prereqs === 'undefined') {
//         console.warn('Task Hard Prereqs are not linked. This will impact performance.')
//         loadAll(task)
//         if (typeof task.hard_prereqs === 'undefined')
//           throw new Error('Loading Task Hard Prereqs failed.')
//         else console.debug({ 'linked prereqs': task.hard_prereqs })
//       }
//       else if (typeof task.hard_postreqs === 'undefined') {
//         console.warn('Task Hard Postreqs are not linked. This will impact performance.')
//         loadAll(task)
//         if (typeof task.hard_postreqs === 'undefined')
//           throw new Error('Loading Task Hard Postreqs failed.')
//         else console.debug({ 'linked postreqs': task.hard_postreqs })
//       }
//       let currentTaskValue = this.allTasks.get(task.id)
//       if (typeof currentTaskValue === 'undefined') {
//         this.allTasks.set(task.id, task)
//         currentTaskValue = this.allTasks.get(task.id)!
//       }
//       const ATHardGet = (id: number) => Utils.hardCheck(this.allTasks.get(id))
//       const vennPres = Utils.venn(currentTaskValue.hard_prereqs, task.hard_prereqs)
//       const vennPosts = Utils.venn(currentTaskValue.hard_postreqs, task.hard_postreqs)
//       console.debug({ vennPres, vennPosts })
//       // left: tasks that have been removed from the dependencies
//       // center: tasks whose state is unchanged
//       // right: tasks that are being added to the dependencies
//       if (typeof ATHardGet === 'undefined') {
//         this.allTasks.set(task.id, task)
//         return
//       }
//       vennPres.left.forEach((x) => {
//         const t = ATHardGet(x.id)
//         // todo: make custom array class
//         Utils.arrayDelete(t.hard_postreqs, currentTaskValue)
//         // todo: will this be necessary, or is t a reference to the value in the Map?
//         this.allTasks.set(t.id, t)
//       })
//       vennPres.center.forEach((x) => {
//         const t = ATHardGet(x.id)
//         // todo: make custom array class
//         Utils.arrayUpdate(t.hard_postreqs, task, 'id')
//         // todo: will this be necessary, or is t a reference to the value in the Map?
//         this.allTasks.set(t.id, t)
//       })
//       vennPres.right.forEach((x) => {
//         const t = ATHardGet(x.id)
//         t.hard_postreqs.push(task)
//         // todo: will this be necessary, or is t a reference to the value in the Map?
//         this.allTasks.set(t.id, t)
//       })
//       vennPosts.left.forEach((x) => {
//         const t = ATHardGet(x.id)
//         // todo: make custom array class
//         Utils.arrayDelete(t.hard_prereqs, currentTaskValue)
//         // todo: will this be necessary, or is t a reference to the value in the Map?
//         this.allTasks.set(t.id, t)
//       })
//       vennPres.center.forEach((x) => {
//         const t = ATHardGet(x.id)
//         // todo: make custom array class
//         Utils.arrayUpdate(t.hard_prereqs, task, 'id')
//         // todo: will this be necessary, or is t a reference to the value in the Map?
//         this.allTasks.set(t.id, t)
//       })
//       vennPres.right.forEach((x) => {
//         const t = ATHardGet(x.id)
//         t.hard_prereqs.push(task)
//         // todo: will this be necessary, or is t a reference to the value in the Map?
//         this.allTasks.set(t.id, t)
//       })
//       return task
//     },
//     checkAgainstKnownCompletedTasks(...tasks: Task[]) {
//       tasks.forEach((x) => {
//         if (this.completedTasks.has(x.id)) {
//           console.warn(`COMPLETED TASK DETECTED: ${x.title}`)
//         }
//       })
//     },
//     delete(task: Task) {
//       this.allTasks.delete(task.id)
//       this.completedTasks.delete(task.id)
//       this.incompleteTasks.delete(task.id)
//       Utils.arrayDelete(this.layerZero, task)
//     },
//     get layerZero(): Task[] {
//       const vals = new Array<Task>()
//       if(typeof this.allTasks === 'undefined') throw new Error('allTasks was undefined.');
//       (this.allTasks as Map<number, Task>).forEach((val: Task) => {
//         if(val.completed) return
//         if(!val.hard_prereqs.some(x => !x.completed)) vals.push(val)
//       })
//       return vals
//     }
//   }
// })
