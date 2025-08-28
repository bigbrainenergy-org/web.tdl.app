<template>
  <q-dialog ref="dialogRef" :maximized="$q.screen.lt.md" @hide="onDialogHide">
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Stuck Tasks</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      
      <q-card-section>
        <q-item v-if="!stuckTaskValues.length">
          <q-item-section>
            <strong>No stuck tasks</strong>
          </q-item-section>
        </q-item>
        <q-intersection v-for="task in stuckTaskValues" :key="task.id" once style="min-height: 48px">
          <TaskItem :task="task" @click="openTask(task.id)" :class="mostSuspiciousStuckTasks.has(task.id) ? 'bg-red-1' : ''"/>
        </q-intersection>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent } from 'quasar'
  import { openUpdateTaskDialog } from 'src/utils/dialog-utils'
  import { stuckTasks } from 'src/stores/tasks/task-utils'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import TaskItem from 'src/components/TaskItem.vue'
  import { computed } from 'vue'
  import { mostSuspiciousStuckTasks } from 'src/stores/tasks/task-utils'

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide } = useDialogPluginComponent()
  const taskStore = useTaskStore()
  const stuckTaskValues = computed(() => Array.from(stuckTasks.value.values()).map(x => taskStore.mapp.get(x)).filter(x => x !== undefined) as Task[])
  console.assert(!stuckTaskValues.value.some(x => x.completed), 'Stuck task is completed')

  function openTask(id: number) {
    const task = stuckTaskValues.value.find(x => x.id === id)
    if(task) {
      openUpdateTaskDialog(task)
    }
  }

</script>