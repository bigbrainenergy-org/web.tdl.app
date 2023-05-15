export interface ICreateNextActionOptions {
  context_id: number | undefined
  project_id: number | undefined
  title: string
  notes: string | undefined
  remind_me_at: string | undefined
  mental_energy_required: number | undefined
  physical_energy_required: number | undefined
  hard_prereq_ids: Array<number>
  hard_postreq_ids: Array<number>
}