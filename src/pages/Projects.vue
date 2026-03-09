<template>
  <q-page class="projects-page">
    <q-card class="projects-card text-primary">
      <q-card-actions class="q-pa-sm">
        <div class="text-h6 q-ml-sm">Projects</div>
        <q-space />
        <q-btn
          v-if="needRefinement.length > 0"
          flat
          @click="openProjectNeedsRefinement"
        >
          REFINE
        </q-btn>
        <q-btn-toggle
          v-model="animationSetting"
          flat
          dense
          toggle-color="primary"
          :options="[
            { label: 'disable animation', value: false },
            { label: 'animate', value: true }
          ]"
          @update:model-value="refreshGraph" 
        />
        <q-btn-toggle
          v-model="layoutDirection"
          flat
          dense
          toggle-color="primary"
          :options="[
            { label: 'TD', value: 'TB' },
            { label: 'LR', value: 'LR' }
          ]"
          @update:model-value="refreshGraph"
        />
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
          :nodes-draggable="false"
          class="vue-flow-custom"
        >
          <Background pattern-color="#424242" :gap="16" />
          <Controls :show-fit-view="false" />

          <template #node-custom="{ data, sourcePosition, targetPosition }">
            <Handle type="target" :position="targetPosition" style="opacity: 0" />
            <TaskCard
              :task="data.task"
              :show-pre-post-count="true"
              :show-prerequisites="true"
              @click="onNodeClick(data.task)"
              @prereq-click="onNodeClick"
            />
            <Handle type="source" :position="sourcePosition" style="opacity: 0" />
          </template>
        </VueFlow>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch, nextTick } from 'vue'
  import { useMeta } from 'quasar'
  import { VueFlow, useVueFlow, Handle } from '@vue-flow/core'
  import { Background } from '@vue-flow/background'
  import { Controls } from '@vue-flow/controls'
  import type { Node, Edge } from '@vue-flow/core'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import TaskCard from 'src/components/TaskCard.vue'
  import { openUpdateTaskDialog, considerOpeningQuickSortDialog } from 'src/utils/dialog-utils'
  import { useLayout } from 'src/composables/use-layout'

  // Import required styles
  import '@vue-flow/core/dist/style.css'
  import '@vue-flow/core/dist/theme-default.css'

  useMeta(() => ({ title: 'Projects | TDL App' }))

  const ts = useTaskStore()
  const hideCompleted = ref(true)
  const layoutDirection = ref<'TB' | 'LR'>('LR')
  const animationSetting = ref(false)
  const nodes = ref<Node[]>([])
  const edges = ref<Edge[]>([])

  const { fitView, onNodesInitialized } = useVueFlow()
  const { layout } = useLayout()

  // Filter tasks that have !PROJECT in their notes
  const projectTasks = computed(() => {
    void ts.arrayVersion // Touch to trigger reactivity when task properties change
    return ts.array.filter(task => {
      const hasProjectTag = task.notes?.includes('!PROJECT') ?? false
      const shouldInclude = hideCompleted.value ? !task.completed : true
      return hasProjectTag && shouldInclude
    })
  })

  const needRefinement = computed(() => {
    return projectTasks.value.filter(x => {
      // props.task.notes?.includes('!REFINE') || props.task.grabPrereqs(true).filter(x => !x.notes?.includes('!PROJECT')).length === 0 || props.task.grabPostreqs(true).filter(x => x.notes?.includes('!PROJECT')).length === 0
      if (x.notes?.includes('!REFINE')) return true
      if (x.grabPrereqs(true).filter(y => !y.notes?.includes('!PROJECT')).length === 0) return true
      if (x.grabPostreqs(true).filter(y => y.notes?.includes('!PROJECT')).length === 0) return true
      return false
    })
  })

  const openProjectNeedsRefinement = () => {
    if(needRefinement.value.length === 0) return
    const selectedTask = needRefinement.value[Math.floor(Math.random()*needRefinement.value.length)]
    if(selectedTask) onNodeClick(selectedTask)
  }

  // Build graph data and apply automatic layout
  const buildGraphData = async (init = false) => {
    const tasks = projectTasks.value
    if (tasks.length === 0) {
      nodes.value = []
      edges.value = []
      return
    }

    const taskIds = new Set(tasks.map(t => t.id))

    // Build nodes
    const newNodes: Node[] = tasks.map(task => ({
      id: task.id.toString(),
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { task },
      style: { width: '300px' }
    }))

    // Build edges (only between project tasks)
    const newEdges: Edge[] = tasks.flatMap(task =>
      task.hard_postreq_ids
        .filter(postId => taskIds.has(postId))
        .map(postId => ({
          id: `e${task.id}-${postId}`,
          source: task.id.toString(),
          target: postId.toString(),
          type: 'default',
          animated: animationSetting.value,
          style: { stroke: '#999', strokeWidth: 3 },
          markerEnd: 'arrow'
        }))
    )

    // First pass: set nodes so they render and get dimensions
    nodes.value = newNodes
    edges.value = newEdges

    if(init) {
      // Wait for vue-flow to initialize nodes with dimensions
      await new Promise<void>(resolve => {
        const { off } = onNodesInitialized(() => {
          off()
          resolve()
        })
      })
    }
    

    // Second pass: re-layout with actual dimensions
    nodes.value = layout(newNodes, newEdges, layoutDirection.value)

    await nextTick()
    fitView({ padding: 0.2, duration: 300 })
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

  onMounted(() => buildGraphData(true))
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
  fill: #999;
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
