<template>
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="column full-height">
      <q-card-actions class="bg-primary text-white">
        <GloriousSettingsPopup>
          <GloriousSlider
            v-model:model-value="graphDepthPres"
            cute-name="Prereq Depth"
            :min="0"
            :max="5"
            :step="1"
          />
          <GloriousSlider
            v-model:model-value="graphDepthPosts"
            cute-name="Postreq Depth"
            :min="0"
            :max="5"
            :step="1"
          />
          <q-toggle
            v-model="graphTraverseThroughCompleted"
            label="Traverse through completed"
            dense
          />
        </GloriousSettingsPopup>
        <div class="text-h6 q-ml-sm">{{ currentTask.title }}</div>
        <q-space />
        <q-btn flat round icon="close" @click="onDialogCancel" />
      </q-card-actions>

      <q-card-section class="col graph-section">
        <TaskGraph
          ref="taskGraphRef"
          :nodes="nodes as GraphNode[]"
          :links="links as GraphLink[]"
          @node-click="onNodeClick"
          @node-context-menu="onNodeContextMenu"
        />
      </q-card-section>

      <q-card-actions class="bg-grey-9">
        <q-btn flat label="Edit Details" icon="edit" @click="openOriginalDialog" />
        <q-space />
        <q-btn flat label="Actions" icon="more_vert">
          <q-menu>
            <TaskItemMenu :task="(currentTask as Task)" />
          </q-menu>
        </q-btn>
        <q-btn flat label="Close" @click="onDialogCancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent } from 'quasar'
  import { computed, ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import { openUpdateTaskDialog } from 'src/utils/dialog-utils'
  import GloriousSlider from 'src/components/glorious/GloriousSlider.vue'
  import GloriousSettingsPopup from 'src/components/glorious/GloriousSettingsPopup.vue'
  import TaskItemMenu from 'src/components/TaskItemMenu.vue'
  import TaskGraph from 'src/components/TaskGraph.vue'
  import { type GraphLink, type GraphNode, useTaskGraphData } from 'src/composables/use-task-graph-data'

  const props = defineProps<{
    task: Task
  }>()

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

  const ts = useTaskStore()
  const usr = useLocalSettingsStore()
  const { graphDepthPres, graphDepthPosts, graphTraverseThroughCompleted } = storeToRefs(usr)

  const currentTask = ref<Task>(props.task)
  const centerTaskId = computed(() => currentTask.value.id)
  const taskGraphRef = ref<InstanceType<typeof TaskGraph> | null>(null)

  // Starting tasks: just the current task (center task)
  const startingTasks = computed((): Task[] => {
    const task = ts.mapp.get(currentTask.value.id)
    return task ? [task as Task] : []
  })

  const { nodes, links, buildGraphData } = useTaskGraphData({
    startingTasks,
    centerTaskId
  })

  const openOriginalDialog = () => {
    onDialogCancel()
    openUpdateTaskDialog(currentTask.value as Task)
  }

  const onNodeClick = (task: Task) => {
    if (task.id !== currentTask.value.id) {
      currentTask.value = task
    }
  }

  const onNodeContextMenu = (_task: Task) => {
    // Could open a context menu here if needed
  }

  // Build initial data
  buildGraphData()

  // Watch for settings or task changes
  watch([graphDepthPres, graphDepthPosts, graphTraverseThroughCompleted, currentTask], () => {
    buildGraphData()
  })
</script>

<style scoped>
  .graph-section {
    padding: 0;
    overflow: hidden;
  }
</style>
