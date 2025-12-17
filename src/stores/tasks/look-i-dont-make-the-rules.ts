import { defineStore } from 'pinia'
import type { Task } from './task-model'
import type { TaskLike } from './task-interfaces-types'
import { useTaskStore } from './task-store'
import { useTaskStarredStore } from './task-starred'
import { useTaskNeedsRefinementStore } from './task-needs-refinement'
import { Logger } from 'src/utils/d'
import { recalculate } from './task-view'
import { ref, nextTick } from 'vue'

const gets = (x: number): [number, Task] => [ x, useTaskStore().hardGet(x) ]
const ewwwLogger = new Logger('🤮', '#6abc19')
export const initialized = ref(false)

// Fast lookup function for refresh_all - uses passed map instead of store lookups
const fastGets = (taskMap: Map<number, Task>) => (x: number): [number, Task] | null => {
  const task = taskMap.get(x)
  return task ? [x, task] : null
}

export const dontLookAtMe = defineStore('ewww', {
  state: () => ({
    // Keep incomplete collections as Maps since they're used in performance-critical task sorting
    incomplete_pres: new Map<number, Map<number, Task>>(),
    incomplete_posts: new Map<number, Map<number, Task>>(),
    pres: new Map<number, Map<number, Task>>(),
    posts: new Map<number, Map<number, Task>>()
  }),
  actions: {
    refresh(data: Task | TaskLike) {
      const pres = data.hard_prereq_ids.map(gets)
      const posts = data.hard_postreq_ids.map(gets)
      
      this.pres.set(data.id, new Map(pres))
      this.posts.set(data.id, new Map(posts))
      
      // Store Maps for incomplete collections to support task sorting performance
      this.incomplete_pres.set(data.id, new Map(pres.filter(x => !x[1].completed)))
      this.incomplete_posts.set(data.id, new Map(posts.filter(x => !x[1].completed)))
    },
    
    grabIncompletePres(id: number): Map<number, Task> {
      let x = this.incomplete_pres.get(id) as Map<number, Task> | undefined
      if(!x) {
        x = new Map()
        this.incomplete_pres.set(id, x)
      }
      return x
    },
    
    grabIncompletePosts(id: number): Map<number, Task> {
      let x = this.incomplete_posts.get(id) as Map<number, Task> | undefined
      if(!x) {
        x = new Map()
        this.incomplete_posts.set(id, x)
      }
      return x
    },
    
    grabPres(id: number): Map<number, Task> {
      let x = this.pres.get(id) as Map<number, Task> | undefined
      if(!x) {
        x = new Map<number, Task>()
        this.pres.set(id, x)
      }
      return x
    },
    
    grabPosts(id: number): Map<number, Task> {
      let x = this.posts.get(id) as Map<number, Task> | undefined
      if(!x) {
        x = new Map<number, Task>()
        this.posts.set(id, x)
      }
      return x
    },
    
    refreshPres(data: TaskLike) {
      const pres = data.hard_prereq_ids.map(gets)
      this.pres.set(data.id, new Map(pres))
      this.incomplete_pres.set(data.id, new Map(pres.filter(x => !x[1].completed)))
    },
    
    refreshPosts(data: TaskLike) {
      const posts = data.hard_postreq_ids.map(gets)
      this.posts.set(data.id, new Map(posts))
      this.incomplete_posts.set(data.id, new Map(posts.filter(x => !x[1].completed)))
    },
    
    refresh_all(data: Task[], taskMap?: Map<number, Task>) {
      ewwwLogger.log(`Refreshing ${data.length} tasks in ewww store`)
      const start = performance.now()

      // Fast path: if taskMap is provided, use it directly to avoid repeated hardGet calls
      if (taskMap) {
        const getter = fastGets(taskMap)

        // Build Maps in local variables first to avoid triggering Pinia reactivity on every set
        const buildStart = performance.now()
        const newPres = new Map<number, Map<number, Task>>()
        const newPosts = new Map<number, Map<number, Task>>()
        const newIncompletePres = new Map<number, Map<number, Task>>()
        const newIncompletePosts = new Map<number, Map<number, Task>>()

        data.forEach(x => {
          // Access underlying arrays directly to bypass Proxy traps
          const presRaw = x._hard_prereq_ids.map(getter).filter(Boolean) as [number, Task][]
          const postsRaw = x._hard_postreq_ids.map(getter).filter(Boolean) as [number, Task][]

          newPres.set(x.id, new Map(presRaw))
          newPosts.set(x.id, new Map(postsRaw))
          newIncompletePres.set(x.id, new Map(presRaw.filter(([_, task]) => !task.completed)))
          newIncompletePosts.set(x.id, new Map(postsRaw.filter(([_, task]) => !task.completed)))
        })
        ewwwLogger.log(`built shadow maps in ${performance.now() - buildStart}ms`)

        // Batch update the store state - single reactivity trigger instead of 62k+
        const storeUpdateStart = performance.now()
        this.pres = newPres
        this.posts = newPosts
        this.incomplete_pres = newIncompletePres
        this.incomplete_posts = newIncompletePosts
        ewwwLogger.log(`updated store state in ${performance.now() - storeUpdateStart}ms`)

        ewwwLogger.log(`ewww refresh_all (fast path) completed in ${performance.now() - start}ms`)
        console.log(`[RAW] fast path done at ${performance.now()}`)
      } else {
        // Slow path: fall back to original implementation
        data.forEach(x => this.refresh(x))
        ewwwLogger.log(`ewww refresh_all (slow path) completed in ${performance.now() - start}ms`)
        console.log(`[RAW] slow path done at ${performance.now()}`)
      }

      console.log(`[RAW] about to set initialized at ${performance.now()}`)
      ewwwLogger.log('setting initialized to true...')
      const initStart = performance.now()
      initialized.value = true
      ewwwLogger.log(`initialized set (took ${performance.now() - initStart}ms)`)

      // Sync starred/refinement sets from task notes (DB source of truth)
      const syncStart = performance.now()
      useTaskStarredStore().initializeFromTasks(data)
      useTaskNeedsRefinementStore().initializeFromTasks(data)
      ewwwLogger.log(`starred/refinement sync from notes took ${performance.now() - syncStart}ms`)

      ewwwLogger.log('refresh_all complete, scheduling recalculate after next DOM update...')

      // Use Vue's nextTick to defer recalculate until after Vue's DOM update cycle
      nextTick(() => {
        const recalcStart = performance.now()
        recalculate('ewww refresh_all')
        ewwwLogger.log(`recalculate after refresh_all took ${performance.now() - recalcStart}ms`)
      })
    },
    
    addRule(first_id: number, second_id: number) {
      const post = gets(second_id)
      const pre = gets(first_id)
      
      this.grabPosts(first_id).set(second_id, post[1])
      this.grabPres(second_id).set(first_id, pre[1])
      
      if(!post[1].completed) this.grabIncompletePosts(first_id).set(second_id, post[1])
      if(!pre[1].completed) this.grabIncompletePres(second_id).set(first_id, pre[1])
    },
    
    removeRule(first_id: number, second_id: number) {
      this.grabPosts(first_id).delete(second_id)
      this.grabPres(second_id).delete(first_id)
      this.grabIncompletePosts(first_id).delete(second_id)
      this.grabIncompletePres(second_id).delete(first_id)
    },
    
    updateCompletedStatus(data: Task) {
      if(data.completed) {
        // Remove from incomplete collections when task is completed
        this.grabPres(data.id).forEach((_, preId) => {
          this.grabIncompletePosts(preId).delete(data.id)
        })
        this.grabPosts(data.id).forEach((_, postId) => {
          this.grabIncompletePres(postId).delete(data.id)
        })
      } else {
        // Add back to incomplete collections when task becomes incomplete
        this.grabPres(data.id).forEach((_, preId) => {
          this.grabIncompletePosts(preId).set(data.id, data)
        })
        this.grabPosts(data.id).forEach((_, postId) => {
          this.grabIncompletePres(postId).set(data.id, data)
        })
      }
    },
    
    upsertPre(id: number, pre_id: number) {
      const pre = gets(pre_id)
      this.grabPres(id).set(pre_id, pre[1])
      if(!pre[1].completed) this.grabIncompletePres(id).set(pre_id, pre[1])
    },
    
    upsertPost(id: number, post_id: number) {
      const post = gets(post_id)
      this.grabPosts(id).set(post_id, post[1])
      if(!post[1].completed) this.grabIncompletePosts(id).set(post_id, post[1])
    }
  }
})