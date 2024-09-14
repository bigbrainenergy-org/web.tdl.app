import { AllOptionalTaskProperties } from '../tasks/task'
import { T2 } from './t2-model'

export interface T2State {
  mapp: Map<number, T2>
  array: T2[]
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
}

export interface UpdateTaskLike {
  id: number
  payload: {
    task: AllOptionalTaskProperties
  }
}
