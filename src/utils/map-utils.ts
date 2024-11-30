import { Task } from 'src/stores/tasks/task-model'

/**
 * If the key is not associated with a value yet, this initializes and sets the value and returns it.
 * @param q the Map
 * @param key the key to search for
 * @returns the value or a new empty array set at the key
 */
export const safeAccess = (q: Map<number, Task[]>, key: number): Task[] => {
  if(typeof q.get(key) === 'undefined') q.set(key, [])
  return q.get(key)!
}