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
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <template v-if="searchString">
              <q-separator class="q-my-md" />
              <div class="text-h4 q-mb-md">{{ resultsTitle }} - {{ results.length }}</div>
              <q-list>
                <q-item v-if="!results.length" v-ripple clickable>
                  <q-item-section>No results found</q-item-section>
                </q-item>
                <q-item v-if="showCreateButton">
                  <q-btn icon="fas fa-plus" label="Create A New Task" color="primary" @click="createTask" />
                </q-item>
                <q-item v-for="task in results" :key="task.id ?? -1" v-ripple clickable
                  @click="selectTask(task as Task)">
                  <q-item-section>
                    <q-item-label lines="2">
                      {{ task.title }}
                    </q-item-label>
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

  import { computed, ref, watch } from 'vue'

  import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task'
  import { Utils } from 'src/util'
  // import { useRepo } from 'pinia-orm'
  // import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import TaskSearchInput from '../search/TaskSearchInput.vue'
  import { λ } from 'src/utils/types'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { useRepo } from 'pinia-orm'
  import SettingsButton from '../SettingsButton.vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import Fuse, { FuseResult } from 'fuse.js'
  import { timeThisB } from 'src/utils/performance-utils'

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

  const debounceAmount = ref(100)
  const results = ref<Task[]>([])

  const searchString = ref<string | undefined>(undefined)

  const key = ref(0)

  Utils.hardCheck(props.dialogTitle, 'Dialog title must be given a value')
  useLoadingStateStore().busy = true

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

  const tr = useRepo(TaskRepo)
  // const usr = useLocalSettingsStore()

  const usr = useLocalSettingsStore()
  const hideCompleted = ref(usr.hideCompleted)
  const taskSearchSettings = ref({ 'Omit Completed Tasks': hideCompleted })

  watch(hideCompleted, () => {
    usr.hideCompleted = hideCompleted.value
  })

  /**
   * The default batch filter checks if current task is defined, plus checks omitRedundant setting to provide default behavior of the task search dialog.
   */
  const defaultBatchFilter = (taskID: number | undefined) => (tasks: Task[]) => {
    if (typeof props.batchFilter !== 'undefined') {
      return props.batchFilter(taskID)(tasks)
    }
    return tasks
  }

  const selectTask = (task: Task) => {
    emit('select', { task: task })
    if (props.closeOnSelect) onDialogCancel()
    else key.value++
  }
  const onCancelClick = () => {
    useLoadingStateStore().busy = false
    onDialogCancel()
  }

  const createTask = async () => {
    if (typeof searchString.value === 'undefined') return
    const toCreate: CreateTaskOptions = {
      title: searchString.value
    }
    const newTask = await tr.add(toCreate)
    selectTask(newTask)
  }

  const hideDialog = () => {
    useLoadingStateStore().busy = false
    onDialogHide()
  }

  // can't set this in withDefaults... don't even try
  // DON'T
  const defaultFilter = (currentTaskID: number | undefined) => {
    const filterCompleted = useLocalSettingsStore().hideCompleted
    if (filterCompleted) {
      return (x: Task) => {
        if (x.completed) return false
        return true
      }
    }
    return (x: Task) => true
  }

  const filterish = computed(() => props.initialFilter ?? defaultFilter)

  const getTasks = () => {
    console.debug('getting pre filtered task list.')
    const start = performance.now()
    const allTasks = tr.withAll().where(filterish.value(props.taskID)).get()
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

  const searchOptions = {
    isCaseSensitive: false,
    ignoreLocation: true,
    keys: ['title']
  }

  const fuse = computed(() => new Fuse(tasks.value, searchOptions))

  const searchForTasks = () => {
    const start = performance.now()
    const str = searchString.value ?? ''

    // unsanitized user input being fed into a library? what could go wrong.
    // FIXME: AKA this is a vuln waiting to happen, fix it.
    const run = timeThisB<FuseResult<Task>[]>(() => fuse.value.search(str), 'fuse search', 55)()

    console.log({ run })

    results.value = run.map((x) => x.item)
    const duration = Math.floor(performance.now() - start)
    console.log(`task search took ${Math.floor(duration)}ms`)
    if (duration * 2 > debounceAmount.value) {
      const newDebounce = Math.min(500, Math.max(duration * 2, debounceAmount.value))
      console.warn(`rolling back debounce to ${newDebounce}`)
      debounceAmount.value = newDebounce
    }
  }
</script>
