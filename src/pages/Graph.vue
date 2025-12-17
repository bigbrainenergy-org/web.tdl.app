<template>
  <div>
    <q-page class="graph-page">
      <q-card class="graph-card text-primary">
        <q-card-actions>
          <GloriousSettingsPopup>
            <GloriousSlider v-model:model-value="graphDepthPres" cute-name="Prereq Depth" :min="0" :max="5" :step="1" />
            <GloriousSlider v-model:model-value="graphDepthPosts" cute-name="Postreq Depth" :min="0" :max="5" :step="1" />
            <GloriousSlider v-model:model-value="taskNodeMaxSize" cute-name="Task Node Max Size" :min="100" :max="1000" :step="20" />
            <GloriousToggle v-model:model-value="incompleteOnly" label="Hide Completed Tasks" />
            <q-toggle v-model="graphTraverseThroughCompleted" label="Traverse through completed" dense />
          </GloriousSettingsPopup>
          <TaskSearchInput
            v-model="searchQuery"
            search-label="Search tasks..."
            :debounce="300"
            class="search-input q-mx-sm"
            @do-a-search="onSearch"
          />
          <q-space />
          <q-btn label="Open Largest Task" class="text-primary" @click="openLargest" />
        </q-card-actions>
        <div class="graph-container">
          <TaskGraph
            ref="taskGraphRef"
            :nodes="nodes"
            :links="links"
            @node-click="onNodeClick"
            @node-context-menu="onNodeContextMenu"
          />
        </div>
      </q-card>
    </q-page>

    <q-dialog v-model="contextMenuVisible">
      <q-card v-if="contextMenuTask" style="min-width: 250px">
        <q-card-section class="q-pb-none">
          <div class="text-h6">{{ contextMenuTask.title }}</div>
        </q-card-section>
        <q-card-section class="q-pt-sm">
          <TaskItemMenu :task="(contextMenuTask as Task)" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
  import Fuse from 'fuse.js'
  import { computed, ref, watch } from 'vue'
  import { useMeta } from 'quasar'
  import { storeToRefs } from 'pinia'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { openUpdateTaskDialog, considerOpeningQuickSortDialog } from 'src/utils/dialog-utils'
  import type { Task } from 'src/stores/tasks/task-model'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import GloriousSettingsPopup from 'src/components/glorious/GloriousSettingsPopup.vue'
  import GloriousSlider from 'src/components/glorious/GloriousSlider.vue'
  import GloriousToggle from 'src/components/glorious/GloriousToggle.vue'
  import TaskItemMenu from 'src/components/TaskItemMenu.vue'
  import TaskSearchInput from 'src/components/search/TaskSearchInput.vue'
  import TaskGraph from 'src/components/TaskGraph.vue'
  import { useTaskGraphData } from 'src/composables/use-task-graph-data'
  import { fuseOptions } from 'src/utils/search-utils'

  useMeta(() => ({ title: 'Graph | TDL App' }))

  const ts = useTaskStore()
  const usr = useLocalSettingsStore()

  const {
    hideCompleted: incompleteOnly,
    graphDepthPres,
    graphDepthPosts,
    graphTraverseThroughCompleted,
    maxGraphNodeRadius: taskNodeMaxSize
  } = storeToRefs(usr)

  // Search state
  const searchQuery = ref<string | undefined>('')
  const searchResultIds = ref<Set<number>>(new Set())

  const onSearch = () => {
    if (!searchQuery.value || searchQuery.value.trim() === '') {
      searchResultIds.value = new Set()
    } else {
      const fuse = new Fuse(ts.array, fuseOptions)
      const results = fuse.search(searchQuery.value)
      searchResultIds.value = new Set(results.map(r => r.item.id))
    }
    buildGraphData()
  }

  // Clear search results when query is cleared
  watch(searchQuery, (val) => {
    if (!val || val.trim() === '') {
      searchResultIds.value = new Set()
      buildGraphData()
    }
  })

  // Context menu state
  const contextMenuVisible = ref(false)
  const contextMenuTask = ref<Task | null>(null)

  const openContextMenu = (task: Task) => {
    contextMenuTask.value = task
    contextMenuVisible.value = true
  }

  // TaskGraph ref
  const taskGraphRef = ref<InstanceType<typeof TaskGraph> | null>(null)

  // Starting tasks: union of layer zero + search results
  const startingTasks = computed(() => {
    const tasks = [...ts.layerZero.value]

    // Add search results to starting tasks
    if (searchResultIds.value.size > 0) {
      searchResultIds.value.forEach(id => {
        const task = ts.mapp.get(id) as Task
        if (task && !tasks.some(t => t.id === task.id)) {
          tasks.push(task)
        }
      })
    }

    return tasks
  })

  // Use the shared graph data composable
  const { nodes, links, buildGraphData } = useTaskGraphData({
    startingTasks,
    searchResultIds,
    hideCompleted: incompleteOnly
  })

  // Build initial data
  buildGraphData()

  // Watch for settings changes
  watch([graphDepthPres, graphDepthPosts, graphTraverseThroughCompleted, incompleteOnly], () => {
    buildGraphData()
  })

  // Watch for taskNodeMaxSize changes - requires reinit for radius recalculation
  watch(taskNodeMaxSize, () => {
    usr.maxGraphNodeRadius = taskNodeMaxSize.value
    taskGraphRef.value?.reInitialize()
  })

  const onNodeClick = (task: Task) => {
    openUpdateTaskDialog(task).onDismiss(onDialogClose)
  }

  const onNodeContextMenu = (task: Task, _event: MouseEvent) => {
    openContextMenu(task)
  }

  const onDialogClose = () => {
    buildGraphData()
    considerOpeningQuickSortDialog()
  }

  const openLargest = () => {
    if (nodes.value.length === 0) return
    const largest = nodes.value.reduce((prev, curr) =>
      curr.radius > prev.radius ? curr : prev
    )
    openUpdateTaskDialog(largest.obj as Task).onDismiss(onDialogClose)
  }
</script>

<style scoped>
  .graph-page {
    position: relative;
    padding: 16px;
  }

  .graph-card {
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

  .graph-container {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .graph-container svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .search-input {
    min-width: 200px;
    max-width: 300px;
  }
</style>

<style>
  svg text {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
</style>
