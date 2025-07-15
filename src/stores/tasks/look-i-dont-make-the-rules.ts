import { defineStore } from 'pinia'
import type { Task } from './task-model'
import type { TaskLike } from './task-interfaces-types'
import { useTaskStore } from './task-store'

const gets = (x: number): [number, Task] => [ x, useTaskStore().hardGet(x) ]

export const dontLookAtMe = defineStore('ewww', {
  state: () => ({
    pres: new Map<number, Map<number, Task>>(),
    posts: new Map<number, Map<number, Task>>(),
    incomplete_pres: new Map<number, Map<number, Task>>(),
    incomplete_posts: new Map<number, Map<number, Task>>()
  }),
  actions: {
    refresh(data: TaskLike) {
      const pres = data.hard_prereq_ids.map(gets)
      const posts = data.hard_postreq_ids.map(gets)
      this.pres.set(data.id, new Map(pres))
      this.posts.set(data.id, new Map(posts))
      this.incomplete_pres.set(data.id, new Map(pres.filter(x => !x[1].completed)))
      this.incomplete_posts.set(data.id, new Map(posts.filter(x => !x[1].completed)))
    },
    grabPres(id: number): Map<number, Task> {
      const x = this.pres.get(id)
      if(x) return x as Map<number, Task>
      this.pres.set(id, new Map())
      return this.pres.get(id) as Map<number, Task>
    },
    grabPosts(id: number): Map<number, Task> {
      const x = this.posts.get(id)
      if(x) return x as Map<number, Task>
      this.posts.set(id, new Map())
      return this.posts.get(id) as Map<number, Task>
    },
    grabIncompletePres(id: number): Map<number, Task> {
      const x = this.incomplete_pres.get(id)
      if(x) return x as Map<number, Task>
      this.incomplete_pres.set(id, new Map())
      return this.incomplete_pres.get(id) as Map<number, Task>
    },
    grabIncompletePosts(id: number): Map<number, Task> {
      const x = this.incomplete_posts.get(id)
      if(x) return x as Map<number, Task>
      this.incomplete_posts.set(id, new Map())
      return this.incomplete_posts.get(id) as Map<number, Task>
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
    refresh_all(data: TaskLike[]) {
      data.forEach(x => this.refresh(x))
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
    },
    updateCompletedStatus(data: Task) {
      if(data.completed) {
        this.grabPres(data.id).forEach(x => {
          this.grabIncompletePosts(x.id).delete(data.id)
        })
        this.grabPosts(data.id).forEach(x => {
          this.grabIncompletePres(x.id).delete(data.id)
        })
      }
      else {
        this.grabPres(data.id).forEach(x => {
          this.grabIncompletePosts(x.id).set(data.id, data)
        })
        this.grabPosts(data.id).forEach(x => {
          this.grabIncompletePres(x.id).set(data.id, data)
        })
      }
    },
  }
})