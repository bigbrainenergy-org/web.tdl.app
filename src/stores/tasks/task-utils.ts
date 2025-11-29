import { ref } from 'vue'
import type { CreateTaskOptions, TaskLike } from './task-interfaces-types'
import type { Task } from './task-model'
import { useTaskStore } from './task-store'
export const retrieve = (id: number): Task => useTaskStore().hardGet(id)
export const incompleteOnly = (t: TaskLike) => !t.completed
export const taskLike = (t: TaskLike | CreateTaskOptions, k: keyof TaskLike): t is TaskLike =>
  k in t
export const stuckTasks = ref(new Set<number>())
export const mostSuspiciousStuckTasks = ref(new Set<number>())
export const searchInput = ref<string | undefined>(undefined)