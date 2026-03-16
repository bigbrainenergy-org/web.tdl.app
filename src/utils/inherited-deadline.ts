import type { Task } from 'src/stores/tasks/task-model'

export interface InheritedDeadlineResult {
  deadline: Date
  sourceTaskId: number
  sourceTaskTitle: string
  isOwn: boolean
}

/**
 * Compute the effective deadline for a task, accounting for inherited deadlines
 * from postrequisite chains with duration subtraction.
 *
 * If the task has its own deadline_at, short-circuits immediately.
 * Otherwise walks postreq chains, subtracting each postreq's estimated duration.
 */
export function computeInheritedDeadline(
  task: Task,
  memo: Map<number, InheritedDeadlineResult | null>,
  visited: Set<number>,
  defaultDuration = 15
): InheritedDeadlineResult | null {
  if (memo.has(task.id)) return memo.get(task.id)!
  if (visited.has(task.id)) return null
  visited.add(task.id)

  // Short-circuit: task has its own deadline
  if (task.deadline_at) {
    const result: InheritedDeadlineResult = {
      deadline: new Date(task.deadline_at),
      sourceTaskId: task.id,
      sourceTaskTitle: task.title,
      isOwn: true
    }
    memo.set(task.id, result)
    return result
  }

  // Walk incomplete postreqs
  const candidates: InheritedDeadlineResult[] = []

  for (const ref of task.posts) {
    if (ref.task.completed) continue
    const postResult = computeInheritedDeadline(ref.task, memo, visited, defaultDuration)
    if (postResult) {
      const adjusted = new Date(
        postResult.deadline.getTime() - (ref.task.task_duration_in_minutes ?? defaultDuration) * 60_000
      )
      candidates.push({
        deadline: adjusted,
        sourceTaskId: postResult.sourceTaskId,
        sourceTaskTitle: postResult.sourceTaskTitle,
        isOwn: false
      })
    }
  }

  if (candidates.length === 0) {
    memo.set(task.id, null)
    return null
  }

  let best = candidates[0]!
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i]!.deadline < best.deadline) best = candidates[i]!
  }

  memo.set(task.id, best)
  return best
}

/**
 * Format a deadline relative to now as human-readable text.
 * Shows only the largest time unit: "22d", "3h", "45m".
 * Returns null if overdue (caller handles overdue text).
 */
export function formatDeadlineText(deadline: Date, now: Date): string | null {
  const diffMs = deadline.getTime() - now.getTime()
  if (diffMs < 0) return null

  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}
