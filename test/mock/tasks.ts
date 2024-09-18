import { Task } from 'src/stores/tasks/task-model'

export const mockTaskList: Task[] = [
  new Task({ id: 1, list_id: 1, title: 'Example Task 1' }),
  new Task({ id: 2, list_id: 1, title: 'Example Task 2' })
]
