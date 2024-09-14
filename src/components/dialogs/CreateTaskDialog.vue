<template>
  <!-- notice dialogRef here -->
  <q-dialog
    ref="dialogRef"
    :maximized="$q.screen.lt.md"
    backdrop-filter="blur(4px)"
    data-cy="create_task_dialog"
    @hide="hideDialog"
  >
    <q-card class="q-dialog-plugin only-most-the-screen-lol">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Create Task</div>
        <q-btn
          class="q-ma-sm"
          size="md"
          color="grey"
          label="close"
          data-cy="close_dialog"
          @click="onCancelClick"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <TaskSearchInput
              v-model:model-value="title"
              search-label="Task Title"
              :debounce="debounceAmount"
              @do-a-search="searchForTasks"
            />
            <br />
            <q-input v-model="notes" filled autogrow clearable label="Notes" />

            <br />

            <div class="row">
              <div class="col-grow">
                <q-btn
                  icon="fas fa-plus"
                  label="Create Task"
                  color="primary"
                  data-cy="create_task_submit"
                  @click="createTask"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <template v-if="title">
              <q-separator class="q-my-md" />
              <div class="text-h4 q-mb-md">Possibly Related Tasks</div>
              <q-list>
                <q-item v-if="!results.length" v-ripple clickable>
                  <q-item-section>No results found</q-item-section>
                </q-item>
                <q-item
                  v-for="task in results"
                  :key="task.id ?? -1"
                  v-ripple
                  clickable
                  @click="openTask(task.id)"
                >
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
  import Fuse, { FuseResult } from 'fuse.js'

  import { useDialogPluginComponent } from 'quasar'
  import { timeThisB } from 'src/perf'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { TDLAPP } from 'src/TDLAPP'
  import { computed, onMounted, ref } from 'vue'
  import TaskSearchInput from '../search/TaskSearchInput.vue'
  import { useT2Store } from 'src/stores/t2/t2-store'
  import { T2 } from 'src/stores/t2/t2-model'

  const emit = defineEmits([
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits,
    'create'
  ])

  // REQUIRED; must be called inside of setup()
  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
  // dialogRef      - Vue ref to be applied to QDialog
  // onDialogHide   - Function to be used as handler for @hide on QDialog
  // onDialogOK     - Function to call to settle dialog with "ok" outcome
  //                    example: onDialogOK() - no payload
  //                    example: onDialogOK({ /*.../* }) - with payload
  // onDialogCancel - Function to call to settle dialog with "cancel" outcome

  const title = ref('')
  const notes = ref('')

  const debounceAmount = ref(100)
  const results = ref<T2[]>([])

  const createTask = () => {
    emit('create', {
      options: {
        title: title.value,
        notes: notes.value
      },
      callback: clearFields
    })
  }

  const openTask = TDLAPP.openTask

  const tasks = computed(() => useT2Store().incompleteOnly)

  const searchOptions = {
    isCaseSensitive: false,
    ignoreLocation: true,
    keys: ['title']
  }

  const fuse = computed(() => new Fuse(tasks.value, searchOptions))

  const searchForTasks = () => {
    const start = performance.now()
    const str = title.value ?? ''

    // unsanitized user input being fed into a library? what could go wrong.
    // FIXME: AKA this is a vuln waiting to happen, fix it.
    const run = timeThisB<FuseResult<T2>[]>(() => fuse.value.search(str), 'fuse search', 55)()

    console.log({ run })

    results.value = run.slice(0, 3).map((x) => x.item)
    const duration = Math.floor(performance.now() - start)
    console.log(`task search took ${Math.floor(duration)}ms`)
    if (duration * 2 > debounceAmount.value) {
      const newDebounce = Math.min(500, Math.max(duration * 2, debounceAmount.value))
      console.warn(`rolling back debounce to ${newDebounce}`)
      debounceAmount.value = newDebounce
    }
  }

  const clearFields = () => {
    title.value = ''
    notes.value = ''
  }

  onMounted(() => {
    console.log('busy and createTaskDialogActive are true')
    useLoadingStateStore().busy = true
    useLoadingStateStore().createTaskDialogActive = true
  })

  const onCancelClick = () => {
    console.log('onCancelClick')
    useLoadingStateStore().busy = false
    useLoadingStateStore().createTaskDialogActive = false
    onDialogCancel()
  }

  const hideDialog = () => {
    console.log('hideDialog')
    useLoadingStateStore().busy = false
    useLoadingStateStore().createTaskDialogActive = false
    onDialogHide()
  }
</script>
