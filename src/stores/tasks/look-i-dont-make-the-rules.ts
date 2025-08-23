import { defineStore } from 'pinia'
import type { Task } from './task-model'
import type { TaskLike } from './task-interfaces-types'
import { useTaskStore } from './task-store'
import { Logger } from 'src/utils/d'

const gets = (x: number): [number, Task] => [ x, useTaskStore().hardGet(x) ]
const ewwwLogger = new Logger('🤮', '#6abc19')

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
    
    refresh_all(data: Task[]) {
      ewwwLogger.log(`Refreshing ${data.length} tasks in ewww store`)
      const start = performance.now()
      data.forEach(x => this.refresh(x))
      ewwwLogger.log(`ewww refresh_all completed in ${performance.now() - start}ms`)
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
        this.grabPres(data.id).forEach((task, preId) => {
          this.grabIncompletePosts(preId).set(data.id, data)
        })
        this.grabPosts(data.id).forEach((task, postId) => {
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