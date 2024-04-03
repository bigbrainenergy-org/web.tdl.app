<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">{{ dialogTitle }}</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onCancelClick" />
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
      @select="(e) => selectTask(e.task)" />

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

import { ref } from 'vue';

import { Task } from 'src/stores/tasks/task';
import { Utils } from 'src/util'
// import { useRepo } from 'pinia-orm'
// import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import TaskSearchResults from '../search/TaskSearchResults.vue';
import TaskSearchInput from '../search/TaskSearchInput.vue'
import { λ } from 'src/types'

interface Props {
  dialogTitle: string
  searchLabel?: string
  resultsTitle?: string
  taskID?: number
  closeOnSelect?: boolean
  showCreateButton?: boolean
  initialFilter?: λ<number | undefined, λ<Task, boolean>>
}

const props = withDefaults(defineProps<Props>(), 
  {
    dialogTitle: 'DEFAULT TITLE',
    searchLabel: 'Search',
    resultsTitle: 'Possible Matches',
    closeOnSelect: false,
    showCreateButton: true
  }
)

const searchString = ref<string | undefined>(undefined)

const key = ref(0)

Utils.hardCheck(props.dialogTitle, 'Dialog title must be given a value')

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

const selectTask = (task: Task) => {
  emit('select', { task: task })
  if(props.closeOnSelect) onDialogCancel()
  else key.value++
}
const onCancelClick = onDialogCancel

// const createTask = async () => {
//   const toCreate: CreateTaskOptions = {
//     title: search.value
//   }
//   const newTask = await tr.add(toCreate)
//   selectTask(newTask)
// }

</script>
