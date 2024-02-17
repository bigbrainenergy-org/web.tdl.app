<template>
  <div>
    <q-card-section>
      <div class="row q-gutter-md q-pa-sm">
        <div class="col-12">

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
import type { λ } from '../../types'

interface Prop {
  search?: string
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

// can't set this in withDefaults... don't even try
// DON'T
const defaultFilter = (currentTaskID: number | undefined) => {
  const simplestFilter = (x: Task) => !x.completed
  if(typeof currentTaskID === 'undefined') return simplestFilter
  const ct = useRepo(TaskRepo).find(currentTaskID)
  if(ct === null) {
    return simplestFilter
  }
  else {
    return (x: Task) => {
      if(x.completed) return false
      if(ct.hard_prereq_ids.includes(x.id)) return false
      if(ct.hard_postreq_ids.includes(x.id)) return false
      return true
    }
  }
}

const filterish = computed(() => props.initialFilter ?? defaultFilter)

const tr = useRepo(TaskRepo)

const props = withDefaults(defineProps<Prop>(), {
  showCreateButton: true,
  resultsTitle: 'Search Results',
  searchLabel: 'Search'
})

const currentTask = ref(typeof props.taskID !== 'undefined' ? tr.withAll().find(props.taskID) : null)

const results = ref<Task[]>([])

const searchOptions = {
  isCaseSensitive: false,
  ignoreLocation: true,
  keys: ['title']
}

const tasks = computed(() => {
  return tr.withAll().where(filterish.value(props.taskID)).get()
})

const searchForTasks = () => {
  if(!props.search) { return } // Guard clause if search is empty

  const fuse = new Fuse(tasks.value, searchOptions)

  // unsanitized user input being fed into a library? what could go wrong.
  // FIXME: AKA this is a vuln waiting to happen, fix it.
  const run = fuse.search(props.search)

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
  if(typeof props.search === 'undefined') return
  const toCreate: CreateTaskOptions = { title: props.search }
  const newTask = await tr.add(toCreate)
  selectTask(newTask)
}

const selectTask = (task: Task) => {
  emit('select', { task, callback: searchForTasks })
}

searchForTasks()
</script>