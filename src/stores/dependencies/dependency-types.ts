export interface TaskDependency {
  id: number            // resource ID (used for DELETE)
  first_id: number      // pre-task (must complete first)
  second_id: number     // post-task (depends on first)
  degree: 1 | 2 | 3    // 1=soft, 2=normal, 3=hard
  created_at?: string
}

export interface DependencyEntry {
  task_id: number       // the other task's ID
  degree: 1 | 2 | 3
}
