<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" :maximized="$q.screen.lt.md" backdrop-filter="blur(4px)" @hide="hideDialog">
    <q-card class="q-dialog-plugin only-most-the-screen-lol">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">{{ dialogTitle }}</div>
        <SettingsButton v-model:settings="taskSearchSettings" name="Task Search Settings" color="white" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="hideDialog" />
      </q-card-section>

      <q-separator />

      <TaskSearchInput v-model:model-value="searchString" :search-label="searchLabel" :dialog-title="dialogTitle"
        :debounce="debounceAmount" @do-a-search="searchForTasks" />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm text-white">
          <div class="col-12" style="height: 800px">
            <template v-if="searchString">
              <q-separator class="q-my-md" />
              <div class="text-h4 q-mb-md">{{ resultsTitle }} - {{ results.length }}</div>
              <q-item v-if="showCreateButton">
                <q-btn icon="fas fa-plus" label="Create A New Task" color="primary" @click="createTask" />
              </q-item>
              <q-item v-if="!results.length" v-ripple clickable>
                <q-item-section>No results found</q-item-section>
              </q-item>
              <!-- <q-scroll-area v-else> -->
              <q-list v-else ref="el">
                <q-item v-for="task in results" :key="task.id ?? -1" v-ripple clickable
                  @click="selectTask(task as Task)">
                  <q-item-section :style="colorize(task.id)">
                    <q-item-label lines="2">
                      {{ task.title }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <!-- </q-scroll-area> -->
            </template>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent } from 'quasar'

  import { computed, onMounted, ref, watch } from 'vue'

  import { Utils } from 'src/util'
  import TaskSearchInput from '../search/TaskSearchInput.vue'
  import { λ } from 'src/types'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import SettingsButton from '../SettingsButton.vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { timeThis, timeThisB } from 'src/perf'
  import Fuse, { FuseResult } from 'fuse.js'
  import { Task } from 'src/stores/tasks/task-model'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { CreateTaskOptions } from 'src/stores/tasks/task-interfaces-types'
  // import { useElementSize } from '@vueuse/core'

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

  const props = withDefaults(defineProps<Props>(), {
    dialogTitle: 'DEFAULT TITLE',
    searchLabel: 'Search',
    resultsTitle: 'Possible Matches',
    closeOnSelect: false,
    showCreateButton: true,
    initialFilter: undefined,
    batchFilter: undefined
  })

  const searchString = ref<string | undefined>(undefined)

  const key = ref(0)

  Utils.hardCheck(props.dialogTitle, 'Dialog title must be given a value')
  onMounted(() => {
    useLoadingStateStore().busy = true
    useLoadingStateStore().addDependencyDialogActive = true
  })

  const emit = defineEmits([
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits,
    'select'
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

  // const usr = useLocalSettingsStore()

  const usr = useLocalSettingsStore()
  const omitRedundant = ref(usr.omitRedundantSearchResults)
  const taskSearchSettings = ref({ 'Omit Redundant Tasks': omitRedundant })

  watch(omitRedundant, () => {
    usr.omitRedundantSearchResults = omitRedundant.value
  })

  // can't set this in withDefaults... don't even try
  // DON'T
  const defaultFilter = (currentTaskID: number | undefined) => {
    const simplestFilter = (x: Task) => !x.completed
    if (typeof currentTaskID === 'undefined') return simplestFilter
    const ct = useTaskStore().mapp.get(currentTaskID)
    if (typeof ct === 'undefined') {
      return simplestFilter
    } else {
      return (x: Task) => {
        if (x.completed) return false
        if (ct.hard_prereq_ids.includes(x.id)) return false
        if (ct.hard_postreq_ids.includes(x.id)) return false
        return true
      }
    }
  }

  const filterish = computed(() => props.initialFilter ?? defaultFilter)

  const getTasks = (): Task[] => {
    console.debug('getting pre filtered task list.')
    const start = performance.now()
    const allTasks = (useTaskStore().array as Task[]).filter(filterish.value(props.taskID))
    if (typeof props.batchFilter !== 'undefined') return props.batchFilter(props.taskID)(allTasks)
    const duration = performance.now() - start
    if (duration > allTasks.length / 2)
      console.warn(
        `getting pre-filtered task list took ${Math.floor(duration)}ms - target is ${allTasks.length / 2
        }ms`
      )
    return allTasks
  }

  const tasks = computed(getTasks)

  /**
   * The default batch filter checks if current task is defined, plus checks omitRedundant setting to provide default behavior of the task search dialog.
   */
  // const defaultBatchFilter = (taskID: number | undefined) => (tasks: Task[]) => {
  //   if (omitRedundant.value) {
  //     if (typeof taskID !== 'undefined') {
  //       const ct = useTaskStore().mapp.get(taskID)
  //       if (typeof ct !== 'undefined') {
  //         const relationInfo = ct.hasRelationToAny(tasks.map((x) => x.id))
  //         tasks = tasks.filter((x) => relationInfo.get(x.id) !== true)
  //       }
  //     }
  //   }
  //   if (typeof props.batchFilter !== 'undefined') {
  //     return props.batchFilter(taskID)(tasks)
  //   }
  //   return tasks
  // }

  const searchOptions = {
    isCaseSensitive: false,
    ignoreLocation: true,
    keys: ['title']
  }

  const fuse = computed(() => new Fuse(tasks.value, searchOptions))

  const searchForTasks = () => {
    if (busy.value) {
      console.debug('skipping searchForTasks due to busy signal.')
    }
    // console.debug('searchForTasks begins.')
    const start = performance.now()
    const str = searchString.value ?? ''

    // unsanitized user input being fed into a library? what could go wrong.
    // FIXME: AKA this is a vuln waiting to happen, fix it.
    const run = timeThisB<FuseResult<Task>[]>(() => fuse.value.search(str), 'fuse search', 55)()

    results.value = run.map((x) => x.item)
    timeThis(kickOffRedundancyCheck, 'kickOffRedundancyCheck', 13)()
    //results.value.sort(byRedundancy)
    const duration = Math.floor(performance.now() - start)
    // console.log(`task search took ${Math.floor(duration)}ms`)
    if (duration * 2 > debounceAmount.value && debounceAmount.value < 500) {
      const newDebounce = Math.min(500, Math.max(duration * 2, debounceAmount.value))
      console.warn(`rolling back debounce to ${newDebounce}`)
      debounceAmount.value = newDebounce
    }
  }

  const selectTask = (task: Task) => {
    emit('select', { task })
    searchForTasks()
    if (props.closeOnSelect) onDialogCancel()
    else key.value++
  }
  // const onCancelClick = () => {
  //   useLoadingStateStore().busy = false
  //   useLoadingStateStore().addDependencyDialogActive = false
  //   onDialogCancel()
  // }

  const busy = ref(false)

  const createTask = () => {
    busy.value = true
    if (typeof searchString.value === 'undefined') return
    const toCreate: CreateTaskOptions = { title: searchString.value }
    const start = performance.now()
    const target = 400
    useTaskStore()
      .apiCreate(toCreate)
      .then((result) => {
        if (result === null) return
        if (typeof props.taskID !== 'undefined') selectTask(result)
        const duration = Math.floor(performance.now() - start)
        if (duration > target)
          console.warn(`createTask took ${duration} ms - target is ${target} ms`)
      }, Utils.handleError('Error creating task.'))
    busy.value = false
  }

  const hideDialog = () => {
    useLoadingStateStore().busy = false
    useLoadingStateStore().addDependencyDialogActive = false
    onDialogHide()
  }

  const results = ref<Task[]>([])
  const redundantTasks = ref<Map<number, boolean>>(new Map())
  const colorize = (id: number) =>
    redundantTasks.value.get(id) ? "color: 'warning'" : "color: 'primary'"
  // type HasID = { id: number }
  // const byRedundancy = (a: HasID, b: HasID) =>
  //   redundantTasks.value.has(a.id) ? (redundantTasks.value.has(b.id) ? 0 : 1) : -1
  const kickOffRedundancyCheck = () => {
    // todo: instead of doing this all separate, traversed tasks can be stored in a shared Set<number> and iteration will become much faster.
    // note: I tried storing the traversed Set in pinia but it was running into lockups.
    redundantTasks.value =
      currentTask.value?.hasRelationToAny(results.value.map((x) => x.id)) ?? new Map()
  }
  const currentTask = ref(
    typeof props.taskID !== 'undefined' ? useTaskStore().hardGet(props.taskID) : null
  )
  const debounceAmount = ref(100)
  fuse.value

  const el = ref()
  // const { width } = useElementSize(el)
  // const widthHack = computed(() => ({ width: `${width.value}px`, 'max-width': `${width.value}px` }))
</script>
