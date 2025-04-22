<template>
  <GloriousSettingsPopup>
    <GloriousToggle v-model:model-value="layerZeroOnly" label="Unblocked Tasks Only" />
    <GloriousToggle v-model:model-value="hideCompleted" label="Incomplete Tasks Only" />
    <GloriousToggle v-model:model-value="autoScalePriority" label="Auto Scale Priority" />
  </GloriousSettingsPopup>
  <q-btn text-color="primary" icon="sort" @click="toggleAgenda">
    <q-tooltip>
      Toggle Agenda View Mode
    </q-tooltip>
  </q-btn>
  <q-btn v-if="agendaOnFire" text-color="red" icon="fa-solid fa-dumpster-fire" @click="openLargestOfFirstTenTasks" />
  <q-space />
  <q-item-label class="text-primary">{{ filtered.length }} tasks</q-item-label>
  <q-space />
  
  <!-- <q-btn icon="fa-solid fa-search" class="text-primary" @click="openBespokeSearchDialog()" /> -->
  <TaskSearchInput v-model:model-value="searchString" search-label="Search or Create Tasks" :debounce="debounceAmount" @do-a-search="searchForTasks" @create-task="createTask" />
  <q-btn dense flat no-wrap>
    <q-icon name="arrow_drop_down" />
    <q-menu auto-close>
      <q-list>
        <q-item clickable @click="openQuickSortDialog">
          <q-item-section>Quick Sort</q-item-section>
          <q-item-section avatar>
            <q-icon name="fa-solid fa-signs-post" />
          </q-item-section>
        </q-item>
        <q-item clickable @click="openLargestTask">
          <q-item-section>Open Largest Task</q-item-section>
          <q-item-section avatar>
            <q-icon name="fa-solid fa-weight-hanging" />
          </q-item-section>
        </q-item>
        <q-item clickable @click="wreak">
          <q-item-section>Generate Some Tasks</q-item-section>
          <q-item-section avatar>
            <q-icon name="fa-solid fa-explosion" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { openQuickSortDialog, openUpdateTaskDialog } from 'src/utils/dialog-utils'
  import type { Task } from 'src/stores/tasks/task-model'
  import GloriousToggle from './glorious/GloriousToggle.vue'
  import GloriousSettingsPopup from './glorious/GloriousSettingsPopup.vue'
  import { notifySuccess } from 'src/utils/notification-utils'
  import { timeThisB } from 'src/utils/performance-utils'
  import type { FuseResult } from 'fuse.js'
  import Fuse from 'fuse.js'
  import TaskSearchInput from './search/TaskSearchInput.vue'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  
  const tasks = defineModel<Array<Task>>('tasks', { required: true })
  const filtered = defineModel<Array<Task>>('filtered', { required: true })

  const emit = defineEmits(['search'])

  const localSettingsStore = useLocalSettingsStore()

  const { layerZeroOnly, hideCompleted, autoScalePriority, currentSortingMode } = storeToRefs(localSettingsStore)

  const tasksPageSettings = ref({
    'Unblocked Only': layerZeroOnly,
    'Incomplete Only': hideCompleted,
    'Auto Scale Priority': autoScalePriority
  })

  const toggleAgenda = () => {
    if(currentSortingMode.value === 'sortByAgenda') currentSortingMode.value = 'sortByPostreqs'
    else currentSortingMode.value = 'sortByAgenda'
  }

  const { busy } = storeToRefs(useLoadingStateStore())

  const agendaOnFire = computed(() => {
    if(busy.value === true) return false // <-- BUG for some reason without minding the busy signal, this goes very slow and Firefox calls us "Jank"
    console.debug('hmmmmmm')
    let countFire = 0
    const fireAmt = localSettingsStore.strictModeMaxPostreqs
    const t = tasks.value[0]
    const qtyNonRecurringPostreqs = (x: Task) => x.incomplete_postreqs.filter(x => (x.procedure_ids ?? []).length === 0).length
    if(typeof t === 'undefined') {
      console.debug('task 0 was undefined')
      return false
    }
    if(qtyNonRecurringPostreqs(t) > fireAmt) {
      console.debug(`${t.title} has too many non procedure tasks`)
      return true
    }
    tasks.value.slice(1, 9).forEach(x => {
      if(qtyNonRecurringPostreqs(x) > fireAmt) {
        console.debug(`${x.title} has too many non procedure tasks`)
        countFire++
      }
    })
    return countFire > 2
  })

  const openLargestOfFirstTenTasks = () => {
    if(tasks.value.length === 0) notifySuccess('Nothing to do here!')
    if(tasks.value.length === 1) openUpdateTaskDialog(tasks.value[0]!)
    else {
      notifySuccess('Sort The Postreqs of this Task.')
      let largest = tasks.value[0]!
      // 2024-12-20 hotfix: when task is part of a procedure, I am omitting the incomplete postreqs from the count who are themselves part of a procedure.
      // this is to prevent procedures getting repeatedly shredded by overzealous list tidying
      // UI/UX TODO FIXME - remake recurring tasks/procedures so that they are more robust
      const postreqsForCount = (task: Task) => {
        if((task.procedure_ids ?? []).length > 0) {
          return task.incomplete_postreqs.filter(x => (x.procedure_ids ?? []).length === 0).length
        }
        return task.incomplete_postreqs.length
      }
      for(let i = 1; i < Math.min(9, tasks.value.length); i++) {
        const tmpTask = tasks.value[i]!
        if(postreqsForCount(tmpTask) > postreqsForCount(largest)) {
          largest = tmpTask
        }
      }
      openUpdateTaskDialog(largest)
    }
  }

  const openLargestTask = () => {
    if(tasks.value.length === 0) notifySuccess('Nothing to do here!')
    if(tasks.value.length === 1) openUpdateTaskDialog(tasks.value[0]!)
    else {
      notifySuccess('Sort The Postreqs of this Task.')
      let largest = tasks.value[0]!
      for(let i = 1; i < tasks.value.length; i++) {
        if(tasks.value[i]!.incomplete_postreqs.length > largest.incomplete_postreqs.length) {
          largest = tasks.value[i]!
        }
      }
      openUpdateTaskDialog(largest)
    }
  }

  const searchString = ref<string | undefined>(undefined)
  const debounceAmount = ref(100)
  const searchOptions = {
    isCaseSensitive: false,
    ignoreLocation: true,
    keys: ['title']
  }
  const fuse = computed(() => new Fuse(tasks.value, searchOptions))
  const searchForTasks = () => {
    console.debug({ searching: searchString.value })
    const start = performance.now()
    const str = searchString.value ?? ''

    if(str.length === 0) {
      filtered.value = tasks.value
      return
    }

    // unsanitized user input being fed into a library? what could go wrong.
    // FIXME: AKA this is a vuln waiting to happen, fix it.
    const run = timeThisB<FuseResult<Task>[]>(() => fuse.value.search(str), 'fuse search', 55)()

    // TODO - this conditional is an attempt to fix a bug where sometimes the page loads and the list has zero results until search box is blipped
    if(run.length === 0) {
      console.debug('zero results from search')
      filtered.value = tasks.value
      return
    }
    const results = run.map((x) => x.item)
    console.debug({ results })
    filtered.value = results
    const duration = Math.floor(performance.now() - start)
    console.log(`task search took ${Math.floor(duration)}ms`)
    if (duration * 2 > debounceAmount.value) {
      const newDebounce = Math.min(500, Math.max(duration * 2, debounceAmount.value))
      console.warn(`rolling back debounce to ${newDebounce}`)
      debounceAmount.value = newDebounce
    }
  }
  watch(tasks, searchForTasks)
  const createTask = (title: string) => {
    useTaskStore().apiCreate({ title })
  }
  const wreak = async () => {
    const tr = useTaskStore()
    const autoTaskName = 'auto task for testing purposes'
    for (let i = 1; i < 10; i++) {
      await tr.apiCreate({ title: `${autoTaskName} ${i}` })
    }
  }
</script>
