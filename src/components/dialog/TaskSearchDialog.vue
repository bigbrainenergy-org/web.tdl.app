<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" maximized @hide="hideDialog">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">{{ dialogTitle }}</div>
        <SettingsButton v-model:settings="taskSearchSettings" name="Task Search Settings" color="white" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="hideDialog" />
      </q-card-section>

      <q-separator />

      <TaskSearchInput
      v-model:model-value="searchString"
      :search-label="searchLabel"
      :dialog-title="dialogTitle"
      @do-a-search="key++" />

      <TaskSearchResults
      :key="key"
      :search="searchString" 
      :dialog-title="dialogTitle" 
      :taskID="taskID" 
      :search-label="searchLabel"
      :results-title="resultsTitle"
      :showCreateButton="showCreateButton"
      :initial-filter="initialFilter"
      :batch-filter="defaultBatchFilter"
      @select="(e) => selectTask(e.task)" />

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

import { ref, watch } from 'vue';

import { Task, TaskRepo } from 'src/stores/tasks/task';
import { Utils } from 'src/util'
// import { useRepo } from 'pinia-orm'
// import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import TaskSearchResults from '../search/TaskSearchResults.vue';
import TaskSearchInput from '../search/TaskSearchInput.vue'
import { λ } from 'src/types'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { useRepo } from 'pinia-orm'
import SettingsButton from '../SettingsButton.vue';
import { useLoadingStateStore } from 'src/stores/performance/loading-state'

interface Props {
  dialogTitle: string
  searchLabel?: string
  resultsTitle?: string
  taskID: number | undefined
  closeOnSelect?: boolean
  showCreateButton?: boolean
  initialFilter: λ<number | undefined, λ<Task, boolean>> | undefined
  batchFilter: λ<number | undefined, λ<Task[], Task[]>> | undefined
}

const props = withDefaults(defineProps<Props>(), 
  {
    dialogTitle: 'DEFAULT TITLE',
    searchLabel: 'Search',
    resultsTitle: 'Possible Matches',
    closeOnSelect: false,
    showCreateButton: true,
    initialFilter: undefined,
    batchFilter: undefined
  }
)

const searchString = ref<string | undefined>(undefined)

const key = ref(0)

Utils.hardCheck(props.dialogTitle, 'Dialog title must be given a value')
useLoadingStateStore().busy = true

const emit = defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
  'select',
])

// REQUIRED; must be called inside of setup()
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*.../* }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

// const search = ref('')
// const results = ref<Task[]>([])

// const searchOptions = {
//   isCaseSensitive: false,
//   ignoreLocation: true,
//   keys: ['title']
// }

// const tr = useRepo(TaskRepo)
// const usr = useLocalSettingsStore()

const usr = useLocalSettingsStore()
const omitRedundant = ref(usr.omitRedundantSearchResults)
const taskSearchSettings = ref({ 'Omit Redundant Tasks': omitRedundant })

watch(omitRedundant, () => {
  usr.omitRedundantSearchResults = omitRedundant.value
})

/**
 * The default batch filter checks if current task is defined, plus checks omitRedundant setting to provide default behavior of the task search dialog.
 */
const defaultBatchFilter = (taskID: number | undefined) => (tasks: Task[]) => {
  if(omitRedundant.value) {
    if(typeof taskID !== 'undefined') {
      const ct = useRepo(TaskRepo).find(taskID)
      if(ct !== null) {
        const relationInfo = ct.BulkHasRelationTo(tasks.map(x => x.id), { incompleteOnly: true, useStore: true })
        tasks = tasks.filter(x => relationInfo.get(x.id) !== true)
      }
    }
  }
  if(typeof props.batchFilter !== 'undefined') {
    return props.batchFilter(taskID)(tasks)
  }
  return tasks
}

const selectTask = (task: Task) => {
  emit('select', { task: task })
  if(props.closeOnSelect) onDialogCancel()
  else key.value++
}
const onCancelClick = () => {
  useLoadingStateStore().busy = false
  onDialogCancel()
}

// const createTask = async () => {
//   const toCreate: CreateTaskOptions = {
//     title: search.value
//   }
//   const newTask = await tr.add(toCreate)
//   selectTask(newTask)
// }

const hideDialog = () => {
  useLoadingStateStore().busy = false
  onDialogHide()
}

</script>
