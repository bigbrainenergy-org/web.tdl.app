<template>
  <q-dialog
    ref="dialogRef"
    :maximized="$q.screen.lt.md"
    backdrop-filter="blur(4px)"
    @hide="hideDialog"
  >
    <q-card ref="el" class="q-dialog-plugin only-most-the-screen-lol">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Quick Arrange Next Actions</div>
        <div class="text-h6">Which task should come first?</div>
        <div class="text-h6">{{ postreqsToSort.length }} Postrequisites</div>
        <div class="text-h6">{{ tasksWithoutPostreqs.length }} Tasks Without Postreqs</div>
        <p>
          <q-btn icon="fa-solid fa-plus" class="text-white q-mr-sm" @click="addPostrequisiteDialog(parentTask as Task)" />
          <q-btn icon="fa-solid fa-gear" class="text-white">
            <q-popup-proxy class="q-pa-md" style="width: 200px;">
              <q-item-section>
                <q-item-label lines="2">{{ 'Settings' }}</q-item-label>
              </q-item-section>
              <GloriousSlider
                v-model:model-value="quickSortDialogMaxToShow"
                :min="2"
                :max="10"
                :step="1"
                cute-name="Max Tasks to Select at a Time"
                @update:model-value="tryNewPair"
              />
            </q-popup-proxy>
          </q-btn>
          <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
        </p>
      </q-card-section>
      <q-linear-progress v-if="loading" query stripe size="10px" />
      <template v-if="loading">
        <q-item v-for="index in currentPair.length" :key="index" v-ripple>
          <q-skeleton type="QRadio" class="q-mr-md" />
          <q-item-section>
            <q-skeleton type="text" />
          </q-item-section>

          <q-item-section v-if="$q.screen.gt.sm" side>
            <q-skeleton type="QRadio" />
          </q-item-section>

          <q-item-section v-if="$q.screen.gt.sm" side>
            <q-skeleton type="QChip" />
          </q-item-section>

          <q-item-section v-if="$q.screen.gt.sm" side>
            <q-skeleton type="QBtn" />
          </q-item-section>
        </q-item>
        <q-inner-loading
          :showing="loading"
          label="Loading..."
          label-class="text-teal"
          label-style="font-size: 1.1em"
        />
      </template>
      <template v-else>
        <ul ref="parentRef" style="list-style-type: none; margin: 0; padding: 0;">
          <li v-for="t of currentPair" :key="t.id" class="q-ma-lg vertical-middle" style="display: flex; align-items: center;" color="positive" :disable="loading">
            <q-avatar rounded icon="fa-solid fa-arrows-up-down" class="drag-me q-my-sm q-mr-sm" color="primary" style="cursor: grab;" />
            <div style="flex: 1;">
              <TaskItem
                :task="t as Task"
                @task-clicked="makeSelection(t as Task)"
                @task-completion-toggled="(completed) => handleTaskCompletion(completed, t as Task)"
              />
            </div>
          </li>
        </ul>
      </template>
      <q-card-section class="q-ma-lg vertical-top text-center">
        <q-btn
          :disable="loading"
          class="q-ma-lg"
          size="lg"
          color="grey"
          label="SKIP"
          @click="skip"
        />
        <q-btn
          :disable="loading"
          class="q-ma-lg"
          size="lg"
          color="positive"
          label="CONFIRM ORDER"
          @click="confirmOrder"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent } from 'quasar'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { onMounted, watch, nextTick } from 'vue'
  import { computed, ref } from 'vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import GloriousSlider from 'src/components/glorious/GloriousSlider.vue'
  import { storeToRefs } from 'pinia'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import { notifySuccess } from 'src/utils/notification-utils'
  import { addPostrequisiteDialog } from 'src/utils/dialog-utils'
  import { useDragAndDrop, dragAndDrop } from '@formkit/drag-and-drop/vue'
  import TaskItem from '../TaskItem.vue'

  interface qspotdProps {
    parentTaskId: number
  }

  const props = defineProps<qspotdProps>()
  const parentTask = ref(useTaskStore().hardGet(props.parentTaskId))

  const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent()
  const emit = defineEmits([...useDialogPluginComponent.emits])

  onMounted(() => {
    console.log('busy for quick sort')
    useLoadingStateStore().busy = true
    console.log('setting quick sort dialog active to true')
    useLoadingStateStore().quickSortDialogActive = true
  })

  class PostWeightedTask {
    t: Task
    constructor(t: Task) {
      this.t = t
    }
    weight = () => 1 / Math.min(Math.max(1, this.t.grabPostreqs(true).length), 10)
    shouldReroll = () => Math.random() - this.weight() > 0
  }

  const {
    disableQuickSort,
    // enableDeeperQuickSort,
    enableQuickSortOnLayerZeroQTY,
    // enableQuickSortOnNewTask,
    quickSortDialogMaxToShow,
    enableQuickSortBailOnBigTask,
    quickSortBailOnTaskSize,
    strictModeMaxPostreqs
  } = storeToRefs(useLocalSettingsStore())

  const postWeightedTask = (x: Task) => new PostWeightedTask(x)

  // 2024-12-20 hotfix: filtering out any postreqs that are part of a procedure when parentTask is part of a procedure.
  const postreqsEligibleForSort = (): Task[] => {
    const basePostreqs = (parentTask.value.procedure_ids ?? []).length > 0
      ? parentTask.value.grabPostreqs(true).filter(x => (x.procedure_ids ?? []).length === 0)
      : parentTask.value.grabPostreqs(true)
    // Filter out projects from quick sort
    return basePostreqs.filter(task => !(task.notes?.includes('!PROJECT') ?? false))
  }
  const postreqsToSort = computed(() => postreqsEligibleForSort().map(postWeightedTask))

  // const layerZero = computed(() => {
  //   const layerZeroTasks = useTaskStore().layerZero
  //   return layerZeroTasks.map(postWeightedTask)
  // })
  const tasksWithoutPostreqs = computed(() =>
    postreqsToSort.value.filter((x) => !(x.t.grabPostreqs(true).length > 0))
  )
  const l0len = computed(() => postreqsToSort.value.length)
  watch(l0len, (value: number) => {
    if (value <= strictModeMaxPostreqs.value ) {
      if (dialogRef !== null) onDialogOK()
    }
  })

  const loading = ref(false)
  // const userMax = ref(6)
  // const samplesPerSample = computed(() => Math.min(Math.max(2, Math.ceil(postreqsToSort.value.length/2)), userMax.value))

  // type pair<T> = { a: T; b: T }
  // let skippedPairs: pair<Task>[] = []

  const finishedSorting = (msg = 'Finished Sorting') => {
    notifySuccess(msg)
    useLoadingStateStore().busy = false
    useLoadingStateStore().quickSortDialogActive = false
    if (dialogRef !== null) onDialogHide()
  }

  // type withID<T> = { id: number | null; data: T }

  // let skippedLayerOnePairs: withID<pair<Task>[]>[] = []

  // const getSkippedPairsForID = (id: number | null): pair<Task>[] => {
  //   if (id === null) return skippedPairs
  //   let tmp: withID<pair<Task>[]> | undefined = skippedLayerOnePairs.find((x) => x.id === id)
  //   if (typeof tmp === 'undefined') {
  //     tmp = { id, data: [] }
  //     skippedLayerOnePairs.push(tmp)
  //   }
  //   return tmp.data
  // }

  // const isSkipped = (item: withID<pair<PostWeightedTask>>) =>
  //   getSkippedPairsForID(item.id).some((x) => eq(x, item.data))

  // const permutations = (arr: Array<any>) => 0.5 * arr.length * (arr.length - 1)

  const priorMVPs = new Set<number>()

  /**
   * generateNewPair:
   * - throw an error if sorting is done
   * - select a new pair (or trio or quartet or n-tet)
   */
  const generateNewPair = (): Task[] => {
    const metLayerZeroLengthObjective = l0len.value <= 1
    if (metLayerZeroLengthObjective) throw new Error('reached layer zero length objective.')
    const howManyToSelect = Math.min(l0len.value, quickSortDialogMaxToShow.value)
    let toGenerateFrom = [] // this will filter out all previously selected tasks when possible in order to make the sorting process more effective.
    if(postreqsToSort.value.length - priorMVPs.size > howManyToSelect) toGenerateFrom = postreqsToSort.value.filter(x => !priorMVPs.has(x.t.id))
    else toGenerateFrom = postreqsToSort.value
    const shuffled = [...toGenerateFrom]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }
    return shuffled.slice(0, howManyToSelect).map((x) => x.t)
  }

  let firstPair
  try {
    firstPair = generateNewPair()
  } catch (e: any) {
    console.warn(e)
    finishedSorting()
  }
  if (firstPair === null || typeof firstPair === 'undefined')
    throw new Error('Could not generate first pair') //! FIXME there ought to be a better way

  const [parentRef, currentPair] = useDragAndDrop(firstPair, {
    dragHandle: '.drag-me' // IMPORTANT: the drag and drop plugin only searches maybe 2 elements deep for this class.
  })

  // const forget = (id: number) => {
  //   const idInSkippedPair = (x: pair<Task>) => x.a.id !== id && x.b.id !== id
  //   skippedLayerOnePairs = skippedLayerOnePairs.map((x) => ({
  //     id: x.id,
  //     data: x.data.filter(idInSkippedPair)
  //   }))
  //   skippedPairs = skippedPairs.filter(idInSkippedPair)
  // }


  type ResolveFunc<T> = (value: T | PromiseLike<T>) => void

  /**
   * Wait for the input number of seconds.
   * @param ms to idle/sleep
   * @returns an awaitable Promise<void> that will resolve after the time has elapsed
   * @example
   * console.log("I need to be right back.")
   * await idle_s(2)
   * console.log("I am back after 2 seconds.")
   */
  const idle_ms = async (ms: number): Promise<void> => {
    const timer_function = (resolve: ResolveFunc<void>) => setTimeout(resolve, ms)
    return new Promise(timer_function)
  }
  const reinitializeDragAndDrop = async () => {
    await idle_ms(200)
    nextTick(() => {
      // Force a reactive update by creating a new array reference
      // if (currentPair.value && currentPair.value.length > 0) {
      //   currentPair.value = [...currentPair.value]
      // }
      dragAndDrop({
        parent: parentRef,
        values: currentPair,
        dragHandle: '.drag-me'
      })
    })
  }

  const tryNewPair = async() => {
    try {
      currentPair.value = generateNewPair()
      await reinitializeDragAndDrop()
    } catch (e) {
      notifySuccess('Nothing more to sort')
      if (dialogRef !== null) onDialogOK()
    }
  }

  const handleTaskCompletion = async (completed: boolean, task: Task) => {
    if (!completed) {
      // Task was uncompleted, no need to do anything
      return
    }

    console.debug(`Task ${task.id} completed, removing from quick sort`)

    // The checkbox already toggled task.completed optimistically via v-model
    // Now we need to persist it to the API and update the store
    await task.updateTaskCompletionStatus()

    // Wait for reactivity to update
    await nextTick()

    // Remove the completed task from the current pair
    const remainingTasks = currentPair.value.filter((x) => x.id !== task.id)

    // If we have less than 2 tasks left, get a whole new pair
    if (remainingTasks.length < 2) {
      console.debug('Less than 2 tasks remaining, getting new pair')
      await tryNewPair()
      return
    }

    // Try to find a replacement task from postreqsToSort that's not already in the current pair
    const currentIds = new Set(currentPair.value.map(t => t.id))
    const availableReplacements = postreqsToSort.value.filter(
      (x) => !currentIds.has(x.t.id) && !x.t.completed && !priorMVPs.has(x.t.id)
    )

    if (availableReplacements.length > 0) {
      // Pick a random replacement
      const replacement = availableReplacements[Math.floor(Math.random() * availableReplacements.length)]!
      console.debug(`Adding replacement task ${replacement.t.id}`)
      currentPair.value = [...remainingTasks, replacement.t]
    } else {
      // No replacement available, just use the remaining tasks
      console.debug('No replacement available, continuing with remaining tasks')
      currentPair.value = remainingTasks
    }

    await reinitializeDragAndDrop()
  }

  const makeSelection = async (mvp: Task) => { // TODO: probably time to genericize the mvp task function
    loading.value = true
    priorMVPs.add(mvp.id)
    const selected_tasks = currentPair.value.filter((x) => x.id !== mvp.id)
    const selected_ids = selected_tasks.map((x) => x.id)
    mvp.hard_postreq_ids.push(...selected_ids)
    parentTask.value.hard_postreq_ids = parentTask.value.hard_postreq_ids.filter(x => !selected_ids.includes(x))
    await useTaskStore().apiUpdate(parentTask.value.id, { hard_postreq_ids: parentTask.value.hard_postreq_ids })
    selected_tasks.forEach((x) => {
      x.hard_prereq_ids.push(mvp.id)
    })
    await useTaskStore().apiUpdate(mvp.id, { hard_postreq_ids: mvp.hard_postreq_ids })
    await tryNewPair()
    loading.value = false
  }

  const confirmOrder = async () => {
    loading.value = true
    const first_task = currentPair.value[0]!
    priorMVPs.add(first_task.id)
    const tasks_to_remove_from_parent_task = currentPair.value.slice(1).map(x => x.id)
    // TODO: use a batch update api call for this!
    parentTask.value.hard_postreq_ids = parentTask.value.hard_postreq_ids.filter(x => !tasks_to_remove_from_parent_task.includes(x))
    await useTaskStore().apiUpdate(parentTask.value.id, { hard_postreq_ids: parentTask.value.hard_postreq_ids })
    const taskIds = currentPair.value.map(t => t.id)
    await useTaskStore().stringTasks(taskIds)
    await tryNewPair()
    loading.value = false
  }

  const skip = async () => {
    await tryNewPair()
  }

  const onCancelClick = () => {
    console.log('onCancelClick')
    useLoadingStateStore().busy = false
    console.log('setting quick sort dialog active to false')
    useLoadingStateStore().quickSortDialogActive = false
    onDialogOK()
  }

  const hideDialog = () => {
    console.log('hideDialog')
    useLoadingStateStore().busy = false
    console.log('setting quick sort dialog active to false')
    useLoadingStateStore().quickSortDialogActive = false
    onDialogHide()
  }

</script>

<style>
  .wrapped {
    word-break: break-spaces;
    white-space: break-spaces !important;
  }
</style>