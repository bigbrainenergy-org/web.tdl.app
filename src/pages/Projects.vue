<template>
  <q-page class="projects-page">
    <q-card class="projects-card text-primary">
      <q-card-actions class="q-pa-sm">
        <div class="text-h6 q-ml-sm">Projects</div>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="refresh"
          @click="refreshGraph"
        >
          <q-tooltip>Refresh</q-tooltip>
        </q-btn>
        <q-toggle
          v-model="hideCompleted"
          label="Hide Completed"
          dense
        />
      </q-card-actions>

      <div class="flow-container">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :default-viewport="{ zoom: 0.8 }"
          :min-zoom="0.1"
          :max-zoom="2"
          class="vue-flow-custom"
        >
          <Background pattern-color="#424242" :gap="16" />
          <Controls />

          <template #node-custom="{ data }">
            <TaskCard
              :task="data.task"
              :show-pre-post-count="true"
              @click="onNodeClick(data.task)"
            />
          </template>
        </VueFlow>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useMeta } from 'quasar'
  import { VueFlow } from '@vue-flow/core'
  import { Background } from '@vue-flow/background'
  import { Controls } from '@vue-flow/controls'
  import type { Node, Edge } from '@vue-flow/core'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import TaskCard from 'src/components/TaskCard.vue'
  import { openUpdateTaskDialog, considerOpeningQuickSortDialog } from 'src/utils/dialog-utils'

  // Import required styles
  import '@vue-flow/core/dist/style.css'
  import '@vue-flow/core/dist/theme-default.css'

  useMeta(() => ({ title: 'Projects | TDL App' }))

  const ts = useTaskStore()
  const hideCompleted = ref(false)
  const nodes = ref<Node[]>([])
  const edges = ref<Edge[]>([])

  // Filter tasks that have !PROJECT in their notes
  const projectTasks = computed(() => {
    return ts.array.filter(task => {
      const hasProjectTag = task.notes?.includes('!PROJECT') ?? false
      const shouldInclude = hideCompleted.value ? !task.completed : true
      return hasProjectTag && shouldInclude
    })
  })

  // Create a layout using a simple hierarchical approach
  const buildGraphData = () => {
    const tasks = projectTasks.value
    if (tasks.length === 0) {
      nodes.value = []
      edges.value = []
      return
    }

    // Create a map to track which tasks are already placed
    const taskMap = new Map<number, Task>()
    tasks.forEach(task => taskMap.set(task.id, task))

    // Find root tasks (tasks with no prerequisites or prerequisites not in project set)
    const rootTasks = tasks.filter(task => {
      const hasPrereqsInProject = task.hard_prereq_ids.some(id => taskMap.has(id))
      return !hasPrereqsInProject
    })

    // Build nodes with a hierarchical layout
    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    const positioned = new Set<number>()
    const layers = new Map<number, Task[]>()

    // Assign tasks to layers using BFS
    const assignLayer = (task: Task, layer: number) => {
      if (positioned.has(task.id)) return

      if (!layers.has(layer)) {
        layers.set(layer, [])
      }
      layers.get(layer)!.push(task)
      positioned.add(task.id)

      // Process postreqs
      task.hard_postreq_ids.forEach(postId => {
        const postTask = taskMap.get(postId)
        if (postTask && !positioned.has(postId)) {
          assignLayer(postTask, layer + 1)
        }
      })
    }

    // Start with root tasks
    rootTasks.forEach(task => assignLayer(task, 0))

    // Handle any remaining unpositioned tasks
    tasks.forEach(task => {
      if (!positioned.has(task.id)) {
        assignLayer(task, 0)
      }
    })

    // Create nodes with positions
    const layerSpacing = 300
    const nodeSpacing = 250
    let maxLayerWidth = 0

    layers.forEach((layerTasks, layerIndex) => {
      maxLayerWidth = Math.max(maxLayerWidth, layerTasks.length)

      layerTasks.forEach((task, indexInLayer) => {
        const xOffset = (layerTasks.length - 1) * nodeSpacing / 2
        newNodes.push({
          id: task.id.toString(),
          type: 'custom',
          position: {
            x: indexInLayer * nodeSpacing - xOffset,
            y: layerIndex * layerSpacing
          },
          data: {
            task: task
          },
          style: {
            width: '250px'
          }
        })
      })
    })

    // Create edges based on prereq/postreq relationships
    tasks.forEach(task => {
      task.hard_postreq_ids.forEach(postId => {
        if (taskMap.has(postId)) {
          newEdges.push({
            id: `e${task.id}-${postId}`,
            source: task.id.toString(),
            target: postId.toString(),
            type: 'default',
            animated: false,
            style: { stroke: '#666', strokeWidth: 2 },
            markerEnd: 'arrow'
          })
        }
      })
    })

    nodes.value = newNodes
    edges.value = newEdges
  }

  const refreshGraph = () => {
    buildGraphData()
  }

  const onNodeClick = (task: Task) => {
    openUpdateTaskDialog(task).onDismiss(() => {
      buildGraphData()
      considerOpeningQuickSortDialog()
    })
  }

  // Watch for changes
  watch([projectTasks, hideCompleted], () => {
    buildGraphData()
  })

  // Initial load
  onMounted(() => {
    buildGraphData()
  })
</script>

<style scoped>
.projects-page {
  position: relative;
  padding: 16px;
}

.projects-card {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  background-color: #1d1d1df6;
  overflow: hidden;
}

.flow-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

:deep(.vue-flow-custom) {
  background-color: #121212;
}

:deep(.vue-flow__node) {
  border-radius: 8px;
}

:deep(.vue-flow__node-custom) {
  width: auto !important;
  height: auto !important;
  border-radius: 8px;
}

:deep(.vue-flow__edge-path) {
  stroke-width: 2;
}

:deep(.vue-flow__arrowhead) {
  fill: #666;
}

:deep(.vue-flow__edge.animated .vue-flow__edge-path) {
  stroke-dasharray: 5;
  animation: dashdraw 0.5s linear infinite;
}

:deep(.vue-flow__controls) {
  bottom: 20px;
  left: 20px;
}

:deep(.vue-flow__controls-button) {
  background-color: #2d2d2d;
  border: 1px solid #424242;
  color: #e0e0e0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.vue-flow__controls-button):hover {
  background-color: #3d3d3d;
}

:deep(.vue-flow__controls-button svg) {
  fill: #e0e0e0;
  width: 16px;
  height: 16px;
  display: block;
}
</style>
