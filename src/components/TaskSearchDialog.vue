<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" :maximized="true">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">{{ dialogTitle }}</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <template v-if="task">
              <div class="text-h5 text-primary">{{ task.title }}</div>
              <q-separator class="q-my-md" />
            </template>

            <q-input
              v-model="search"
              filled
              clearable
              @update:model-value="searchForTasks"
              @keyup.enter="searchForTasks"
              debounce="1000"
              :label="searchLabel"
            >
              <template v-slot:append>
                <q-btn
                  round
                  flat
                  dense
                  icon="search"
                  @click="searchForTasks"
                />
              </template>
            </q-input>

            <br>

            <template v-if="search">
              <q-separator class="q-my-md" />
              <div class="text-h4 q-mb-md">{{ resultsTitle }} - {{ results.length }}</div>
              <q-list>
                <q-item clickable v-ripple v-if="!results.length">
                  <q-item-section>No results found</q-item-section>
                </q-item>
                <q-item>
                  <q-btn
                  icon="fas fa-plus"
                  label="Create A New Task"
                  color="primary"
                  @click="createTask"
                />
                </q-item>
                <q-item
                  clickable
                  v-ripple
                  v-for="task in results"
                  :key="task.id ?? -1"
                  @click="selectTask(task as Task)"
                >
                  <q-item-section>
                    {{ task.title }}
                  </q-item-section>
                </q-item>
              </q-list>
            </template>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

import {
  ref,
} from 'vue';
import Fuse from 'fuse.js'

import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task';
import { Utils } from 'src/util'
import { useRepo } from 'pinia-orm'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'

  interface Props {
    dialogTitle: string
    searchLabel?: string
    resultsTitle?: string
    task?: Task
  }

  const props = withDefaults(defineProps<Props>(), 
    {
      dialogTitle: 'DEFAULT TITLE',
      searchLabel: 'Search',
      resultsTitle: 'Possible Matches',
    }
  )

  Utils.hardCheck(props.task, 'Task prop must be given a value')
  Utils.hardCheck(props.dialogTitle, 'Dialog title must be given a value')

  const emit = defineEmits([
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits,
    'select',
  ])

    // REQUIRED; must be called inside of setup()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    // dialogRef      - Vue ref to be applied to QDialog
    // onDialogHide   - Function to be used as handler for @hide on QDialog
    // onDialogOK     - Function to call to settle dialog with "ok" outcome
    //                    example: onDialogOK() - no payload
    //                    example: onDialogOK({ /*.../* }) - with payload
    // onDialogCancel - Function to call to settle dialog with "cancel" outcome

    const search = ref('')
    const results = ref<Task[]>([])

    const searchOptions = {
      isCaseSensitive: false,
      ignoreLocation: true,
      keys: ['title']
    }

    const tr = useRepo(TaskRepo)
    const usr = useLocalSettingsStore()

    function searchForTasks() {
      if(!search.value) { return } // Guard clause if search is empty

      const tasks = tr.withAll().get().filter(x => {
        if(x.completed) return false
        if(x.title === props.task?.title) return false
        if(props.task?.hard_prereq_ids.includes(x.id!)) return false
        if(props.task?.hard_postreq_ids.includes(x.id!)) return false
        return true
      })

      const fuse = new Fuse(tasks, searchOptions)

      // unsanitized user input being fed into a library? what could go wrong.
      // FIXME: AKA this is a vuln waiting to happen, fix it.
      const run = fuse.search(search.value)

      results.value = tasks.filter(
        (task) => {
          return run.some(
            (searchElement) => {
              return (searchElement.item.id === task.id)
            }
          )
        }
      ).sort(
        (first, second) => {
          const firstIndex = run.findIndex(
            (element) => { return element.item.title == first.title }
          )
          const secondIndex = run.findIndex(
            (element) => { return element.item.title == second.title }
          )
          return firstIndex - secondIndex
        }
      )
    }

    const selectTask = (task: Task) => {
      emit('select', { task: task, callback: searchForTasks })
    }
    const onCancelClick = onDialogCancel

const createTask = async () => {
  const toCreate: CreateTaskOptions = {
    title: search.value
  }
  const newTask = await tr.add(toCreate)
  selectTask(newTask)
}

</script>
