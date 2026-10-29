import { ref, type Ref, type ComputedRef } from 'vue'
import type { d3Node } from 'src/models/d3-interfaces'
import type { Task } from 'src/stores/tasks/task-model'
import { useTaskStore } from 'src/stores/tasks/task-store'
import { useTaskStarredStore } from 'src/stores/tasks/task-starred'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { storeToRefs } from 'pinia'

// Minimal interface for Task properties used in graph rendering
// This avoids pinia-orm internal type mismatches while staying type-safe
interface TaskLike {
  id: number
  title: string
  completed: boolean
}

export type GraphNode = d3Node<TaskLike>

export type GraphLink = {
  source: GraphNode
  target: GraphNode
  slopeX: number
  slopeY: number
  angle: number
  normalXoffset: number
  normalYoffset: number
}

export interface UseTaskGraphDataOptions {
  // Starting tasks for traversal (e.g., layer zero, search results, center task)
  startingTasks: ComputedRef<Task[]> | Ref<Task[]>
  // IDs to mark as search results (purple highlight)
  searchResultIds?: Ref<Set<number>>
  // ID to mark as center task (gold highlight)
  centerTaskId?: ComputedRef<number | null> | Ref<number | null>
  // Override depth settings (otherwise uses store)
  depthPres?: Ref<number>
  depthPosts?: Ref<number>
  // Whether to hide completed tasks
  hideCompleted?: Ref<boolean>
}

export function useTaskGraphData(options: UseTaskGraphDataOptions) {
  const ts = useTaskStore()
  const starredStore = useTaskStarredStore()
  const usr = useLocalSettingsStore()
  const { graphDepthPres, graphDepthPosts, graphTraverseThroughCompleted } = storeToRefs(usr)

  // Use provided depths or fall back to store
  const depthPres = options.depthPres ?? graphDepthPres
  const depthPosts = options.depthPosts ?? graphDepthPosts
  const hideCompleted = options.hideCompleted ?? ref(false)

  const nodes = ref<GraphNode[]>([])
  const links = ref<GraphLink[]>([])

  const collectTasks = (): Map<number, Task> => {
    const taskMap = new Map<number, Task>()

    const traverseFrom = (startingTasks: Task[]) => {
      // Add starting tasks
      startingTasks.forEach(task => {
        if (!hideCompleted.value || !task.completed) {
          taskMap.set(task.id, task)
        }
      })

      // Collect prereqs
      let currentLevel = new Set(startingTasks.map(t => t.id))
      for (let d = 0; d < depthPres.value; d++) {
        const nextLevel = new Set<number>()
        currentLevel.forEach(id => {
          const task = ts.mapp.get(id)
          if (task) {
            task.grabPrereqs(false).forEach(pre => {
              if (!taskMap.has(pre.id) && (!hideCompleted.value || !pre.completed)) {
                taskMap.set(pre.id, pre)
                if (!pre.completed || graphTraverseThroughCompleted.value) {
                  nextLevel.add(pre.id)
                }
              }
            })
          }
        })
        currentLevel = nextLevel
        if (currentLevel.size === 0) break
      }

      // Collect postreqs
      currentLevel = new Set(startingTasks.map(t => t.id))
      for (let d = 0; d < depthPosts.value; d++) {
        const nextLevel = new Set<number>()
        currentLevel.forEach(id => {
          const task = ts.mapp.get(id)
          if (task) {
            task.grabPostreqs(false).forEach(post => {
              if (!taskMap.has(post.id) && (!hideCompleted.value || !post.completed)) {
                taskMap.set(post.id, post)
                if (!post.completed || graphTraverseThroughCompleted.value) {
                  nextLevel.add(post.id)
                }
              }
            })
          }
        })
        currentLevel = nextLevel
        if (currentLevel.size === 0) break
      }
    }

    // Traverse from starting tasks
    traverseFrom(options.startingTasks.value)

    return taskMap
  }

  const buildGraphData = () => {
    const taskMap = collectTasks()
    const nodeMap = new Map<number, d3Node<Task>>()

    let i = 0
    taskMap.forEach((task) => {
      const node = task.d3forceNode(i++)
      const isStarred = starredStore.isStarred(task.id)
      const isSearchResult = options.searchResultIds?.value.has(task.id) ?? false
      const isCenterTask = options.centerTaskId?.value === task.id

      // Bump radius for starred tasks
      if (isStarred) {
        node.radius = Math.max(node.radius * 1.3, node.radius + 5)
      }

      // Set metadata
      node.isStarred = isStarred
      node.isSearchResult = isSearchResult
      node.isCenterTask = isCenterTask

      nodeMap.set(task.id, node)
    })

    const newNodes = Array.from(nodeMap.values())
    const newLinks: GraphLink[] = []

    // Create links for all visible connections
    taskMap.forEach((task) => {
      const sourceNode = nodeMap.get(task.id)
      if (!sourceNode) return

      task.grabPostreqs(false).forEach(post => {
        const targetNode = nodeMap.get(post.id)
        if (targetNode) {
          newLinks.push({
            source: sourceNode,
            target: targetNode,
            slopeX: 1,
            slopeY: 1,
            angle: 0,
            normalXoffset: 1,
            normalYoffset: 1
          })
        }
      })
    })

    nodes.value = newNodes
    links.value = newLinks
  }

  return {
    nodes,
    links,
    buildGraphData,
    // Expose settings for parent components
    depthPres,
    depthPosts,
    graphTraverseThroughCompleted
  }
}
