<template>
  <div>
    <q-card-section>
      <div class="row q-gutter-md q-pa-sm">
        <div class="col-12">
          <template v-if="currentTask">
            <div class="text-h5 text-primary">{{ currentTask.title }}</div>
            <q-separator class="q-my-md" />
          </template>

          <q-input
            v-model="search"
            filled
            clearable
            @update:model-value="searchForTasks"
            @keyup.enter="searchForTasks"
            debounce="300"
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
              <q-item v-if="showCreateButton">
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
  </div>
</template>

<script setup lang="ts">
import Fuse from 'fuse.js'
import { useRepo } from 'pinia-orm'
import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task'
import { computed, ref } from 'vue'
import type { λ } from '../types'
import { Utils } from 'src/util'

interface Prop {
  dialogTitle: string
  taskID?: number // if the search will be related to a specific task, set this prop value.
  searchLabel?: string
  resultsTitle?: string
  showCreateButton: boolean
  initialFilter?: λ<number | undefined, λ<Task, boolean>>
}

const emit = defineEmits([
  'select',
  'create'
])

const tr = useRepo(TaskRepo)

const props = withDefaults(defineProps<Prop>(), {
  showCreateButton: true,
  resultsTitle: 'Search Results',
  searchLabel: 'Search',
  initialFilter: (currentTaskID: number | undefined) => {
    if(typeof currentTaskID === 'undefined') return (x: Task) => !x.completed
    const ct = Utils.hardCheck(useRepo(TaskRepo).withAll().find(currentTaskID))
    return (x: Task) => {
      if(x.completed) return false
      if(ct.hard_prereq_ids.includes(x.id)) return false
      if(ct.hard_postreq_ids.includes(x.id)) return false
      return true
    }
  }
})

const currentTask = ref(typeof props.taskID !== 'undefined' ? tr.withAll().find(props.taskID) : null)

const search = ref('')
const results = ref<Task[]>([])

const searchOptions = {
  isCaseSensitive: false,
  ignoreLocation: true,
  keys: ['title']
}

const tasks = computed(() => tr.withAll().where(props.initialFilter(props.taskID)).get())

const searchForTasks = () => {
  if(!search.value) { return } // Guard clause if search is empty

  console.log(tasks.value)

  const isDefined = typeof currentTask.value !== null

  console.log({tasks: tasks.value, isDefined})

  const fuse = new Fuse(tasks.value, searchOptions)

  // unsanitized user input being fed into a library? what could go wrong.
  // FIXME: AKA this is a vuln waiting to happen, fix it.
  const run = fuse.search(search.value)

  results.value = tasks.value.filter(
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

const createTask = async () => {
  const toCreate: CreateTaskOptions = {
    title: search.value
  }
  const newTask = await tr.add(toCreate)
  selectTask(newTask)
}

const selectTask = (task: Task) => {
  emit('select', { task, callback: searchForTasks })
}
</script>