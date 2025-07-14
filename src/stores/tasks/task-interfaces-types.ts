import type { Task } from './task-model'

export interface TaskState {
  mapp: Map<number, Task>
  _array: Task[]
}

export interface TaskTimerState {
  task: Task | null
  minimized: boolean
  timeRemaining: number
  timer: any
}

export interface CreateTaskOptions {
  list_id?: number | null
  title: string
  notes?: string
  deadline_at?: string
  prioritize_at?: string
  remind_me_at?: string
  review_at?: string
  hard_prereq_ids?: number[]
  hard_postreq_ids?: number[]
  procedure_ids?: number[]
  mental_energy_required?: number
  physical_energy_required?: number
  task_duration_in_minutes?: number
}

export interface TaskLike {
  hard_prereq_ids: number[]
  hard_postreq_ids: number[]
  // hard_prereqs: TaskLike[]
  // hard_postreqs: TaskLike[]
  completed: boolean
  id: number
  title: string
  notes?: string
  list_id?: number
  deadline_at?: string
  prioritize_at?: string
  remind_me_at?: string
  review_at?: string
  procedure_ids?: number[]
  mental_energy_required: number
  physical_energy_required: number
  task_duration_in_minutes?: number
}

export interface UpdateTaskLike {
  id: number
  payload: {
    task: AllOptionalTaskProperties
  }
}

export interface AllOptionalTaskProperties {
  list_id?: number | null
  title?: string
  notes?: string
  completed?: boolean
  deadline_at?: string
  prioritize_at?: string
  remind_me_at?: string
  review_at?: string
  hard_prereq_ids?: number[]
  hard_postreq_ids?: number[]
  mental_energy_required?: number
  physical_energy_required?: number
  procedure_ids?: number[]
  task_duration_in_minutes?: number
}
