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
        <div class="text-h6">{{ layerZero.length }} Layer Zero Tasks</div>
        <div class="text-h6">{{ tasksWithoutPostreqs.length }} Tasks Without Postreqs</div>
        <p>
          <q-btn icon="fa-solid fa-plus" class="text-white q-mr-sm" @click="openCreateTaskDialog">
            <q-tooltip>Add Task [q]</q-tooltip>
          </q-btn>
          <q-btn icon="fa-solid fa-gear" class="text-white">
            <q-popup-proxy class="q-pa-md">
              <q-item-section>
                <q-item-label lines="2">{{ 'Settings' }}</q-item-label>
              </q-item-section>
              <GloriousToggle v-model:model-value="disableQuickSort" label="Disable Quick Sort" />
              <GloriousToggle v-model:model-value="disableTaskBreakdown" label="Disable Task Breakdown" />
              <!-- <GloriousToggle
                v-model:model-value="enableDeeperQuickSort"
                label="Deeper Quick Sort"
              /> -->
              <GloriousSlider
                v-model:model-value="enableQuickSortOnLayerZeroQTY"
                :min="1"
                :max="15"
                :step="1"
                cute-name="Max Layer Zero Tasks"
              />
              <!-- <GloriousToggle
                v-model:model-value="enableQuickSortOnNewTask"
                label="Quick Sort on Any Task w/o Postreqs"
              /> -->
              <GloriousSlider
                v-model:model-value="quickSortDialogMaxToShow"
                :min="2"
                :max="10"
                :step="1"
                cute-name="Max Tasks to Select at a Time"
                @update:model-value="tryNewPair"
              />
              <q-item>
                <q-item-section>
                  <q-item-label>Dependency Degree</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <DegreeStars v-model:model-value="quickSortLayerZeroDegree" size="sm" />
                </q-item-section>
              </q-item>
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
  import { nextTick, onMounted, watch } from 'vue'
  import { computed, ref } from 'vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import GloriousSlider from 'src/components/glorious/GloriousSlider.vue'
  import GloriousToggle from 'src/components/glorious/GloriousToggle.vue'
  import { storeToRefs } from 'pinia'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { useDependencyStore } from 'src/stores/dependencies/dependency-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import { notifySuccess } from 'src/utils/notification-utils'
  import { openCreateTaskDialog } from 'src/utils/dialog-utils'
  import { dragAndDrop, useDragAndDrop } from '@formkit/drag-and-drop/vue'
  import { Logger } from 'src/utils/d'
  import TaskItem from '../TaskItem.vue'
  import DegreeStars from '../glorious/DegreeStars.vue'

  const quickSortLogger = new Logger('Quick Sort', '#3498db')

  const props = withDefaults(defineProps<{ objective?: number }>(), {
    objective: 1
  })

  const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent()
  const emit = defineEmits([...useDialogPluginComponent.emits])

  onMounted(() => {
    useLoadingStateStore().busy = true
    quickSortLogger.log('BUSY SIGNAL IS SET TO TRUE')
    useLoadingStateStore().quickSortDialogActive = true
    quickSortLogger.log('QUICK SORT DIALOG IS ACTIVE')
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
    disableTaskBreakdown,
    // enableDeeperQuickSort,
    enableQuickSortOnLayerZeroQTY,
    // enableQuickSortOnNewTask,
    quickSortDialogMaxToShow,
    quickSortLayerZeroDegree
  } = storeToRefs(useLocalSettingsStore())

  const postWeightedTask = (x: Task) => new PostWeightedTask(x)

  const taskStore = useTaskStore()
  // Access the layerZero getter directly - it returns a computed ref
  const layerZeroTasks = taskStore.layerZero
  const layerZero = computed(() =>
    layerZeroTasks.value
      .filter(task => !(task.notes?.includes('!PROJECT') ?? false))
      .map(postWeightedTask)
  )
  const tasksWithoutPostreqs = computed(() =>
    layerZero.value.filter((x) => !(x.t.grabPostreqs(true).length > 0))
  )
  const l0len = computed(() => layerZero.value.length)
  watch(l0len, (value: number, oldValue: number) => {
    quickSortLogger.debug(`Layer zero length changed from ${oldValue} to ${value}`)
    if (value < 2) {
      quickSortLogger.debug('Layer zero has less than 2 tasks, closing dialog')
      if (dialogRef !== null) onDialogOK()
    }
  })

  // Watch layerZero for changes and filter out tasks no longer in layer zero
  watch(() => layerZero.value.map(x => x.t.id), async (newIds) => {
    quickSortLogger.debug(`LayerZero IDs changed: ${newIds}`)
    const layerZeroIdSet = new Set(newIds)
    const currentIds = new Set(currentPair.value.map(t => t.id))
    const removedCount = currentPair.value.filter(t => !layerZeroIdSet.has(t.id)).length

    if (removedCount > 0) {
      quickSortLogger.debug(`${removedCount} tasks no longer in layer zero, finding replacements`)

      // Find available replacements from layer zero that aren't already in currentPair
      const availableReplacements = layerZero.value
        .filter(x => !currentIds.has(x.t.id) && !priorMVPs.has(x.t.id))
        .map(x => x.t)

      // Rebuild the list, replacing removed tasks with new ones at the same positions
      const newPair: Task[] = []
      let replacementIdx = 0

      for (const task of currentPair.value) {
        if (layerZeroIdSet.has(task.id)) {
          // Task is still valid, keep it
          newPair.push(task)
        } else if (replacementIdx < availableReplacements.length) {
          // Task was removed, insert replacement at this position
          newPair.push(availableReplacements[replacementIdx]!)
          replacementIdx++
        }
        // If no replacement available, slot is just removed
      }

      if (newPair.length < 2) {
        // Not enough tasks to continue, try getting a whole new pair or close
        await tryNewPair()
      } else {
        currentPair.value = newPair
        await reinitializeDragAndDrop()
      }
    }
  }, { deep: true })

  //  const layerOne = computed(() =>
  //     enableDeeperQuickSort.value
  //       ? layerZero.value
  //           .filter((x) => x.t.grabPostreqs(true).length > 1)
  //           .map((x) => ({
  //             id: x.t.id,
  //             data: x.t.grabPostreqs(true).map(postWeightedTask2)
  //           }))
  //       : null
  //   )

  // const eq = (pairA: pair<Task>, pairB: pair<PostWeightedTask>): boolean => {
  //   if (pairA.a.id === pairB.a.t.id) {
  //     if (pairA.b.id === pairB.b.t.id) return true
  //   }
  //   if (pairA.a.id === pairB.b.t.id) {
  //     if (pairA.b.id === pairB.a.t.id) return true
  //   }
  //   return false
  // }

  const loading = ref(false)

  // type pair<T> = { a: T; b: T }
  // let skippedPairs: pair<Task>[] = []

  const finishedSorting = (msg = 'Finished Sorting') => {
    notifySuccess(msg)
    useLoadingStateStore().busy = false
    useLoadingStateStore().quickSortDialogActive = false
    if (dialogRef !== null) onDialogHide()
  }

  // type pair<T> = { a: T; b: T }
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
    const metLayerZeroLengthObjective = l0len.value <= props.objective
    if (metLayerZeroLengthObjective) throw new Error('reached layer zero length objective.')
    const howManyToSelect = Math.min(l0len.value, quickSortDialogMaxToShow.value)
    let toGenerateFrom = []
    if(layerZero.value.length - priorMVPs.size > howManyToSelect) toGenerateFrom = layerZero.value.filter(x => !priorMVPs.has(x.t.id))
    else toGenerateFrom = layerZero.value
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
    quickSortLogger.warn(e)
    finishedSorting()
  }
  if (firstPair === null || typeof firstPair === 'undefined')
    throw new Error('Could not generate first pair')

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

  const tryNewPair = async () => {
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

    quickSortLogger.debug(`Task ${task.id} completed, removing from quick sort`)
    quickSortLogger.debug(`Layer zero length before API update: ${layerZero.value.length}`)

    // The checkbox already toggled task.completed optimistically via v-model
    // Now we need to persist it to the API and update the store
    await task.updateTaskCompletionStatus()

    // Wait for reactivity to update
    await nextTick()
    quickSortLogger.debug(`Layer zero length after API update: ${layerZero.value.length}`)

    // The task's completed status changed, so layerZero should eventually update
    // But it might be async, so let's just work with what we know:
    // This task is now completed and should be removed from currentPair

    // Remove the completed task from the current pair
    const remainingTasks = currentPair.value.filter((x) => x.id !== task.id)

    // If we have less than 2 tasks left, get a whole new pair
    if (remainingTasks.length < 2) {
      quickSortLogger.debug('Less than 2 tasks remaining, getting new pair')
      await tryNewPair()
      return
    }

    // Try to find a replacement task from layerZero that's not already in the current pair
    // Filter out completed tasks manually since layerZero might not have updated yet
    // const currentIds = new Set(currentPair.value.map(t => t.id))
    // const availableReplacements = taskStore.array.filter(task => {
    //   // Must be incomplete
    //   if (task.completed) return false
    //   // Must not be in current pair
    //   if (currentIds.has(task.id)) return false
    //   // Must not have been a prior MVP
    //   if (priorMVPs.has(task.id)) return false
    //   // Must have no incomplete prereqs (layer zero)
    //   const incompletePres = task.grabPrereqs(true).filter(p => !p.completed)
    //   if (incompletePres.length > 0) return false
    //   return true
    // })

    // if (availableReplacements.length > 0) {
    //   // Pick a random replacement
    //   const replacement = availableReplacements[Math.floor(Math.random() * availableReplacements.length)]!
    //   quickSortLogger.debug(`Adding replacement task ${replacement.id}`)
    //   currentPair.value = [...remainingTasks, replacement]
    // } else {
    //   // No replacement available, just use the remaining tasks
    //   quickSortLogger.debug('No replacement available, continuing with remaining tasks')
    //   currentPair.value = remainingTasks
    // }

    await reinitializeDragAndDrop()
  }

  const makeSelection = async (mvp: Task) => {
    loading.value = true
    const depStore = useDependencyStore()
    const selected_tasks = currentPair.value.filter((x) => x.id !== mvp.id)
    for (const t of selected_tasks) {
      await depStore.addRule(mvp.id, t.id, { degree: quickSortLayerZeroDegree.value })
    }
    await tryNewPair()
    loading.value = false
  }

  const confirmOrder = async () => {
    loading.value = true
    const depStore = useDependencyStore()
    const taskIds = currentPair.value.map(t => t.id)
    await depStore.stringTasks(taskIds, quickSortLayerZeroDegree.value)
    await tryNewPair()
    loading.value = false
  }

  const skip = async () => {
    await tryNewPair()
  }

  const onCancelClick = () => {
    quickSortLogger.log('onCancelClick')
    useLoadingStateStore().busy = false
    quickSortLogger.log('setting quick sort dialog active to false')
    useLoadingStateStore().quickSortDialogActive = false
    onDialogOK()
  }

  const hideDialog = () => {
    quickSortLogger.log('hideDialog')
    useLoadingStateStore().busy = false
    quickSortLogger.log('setting quick sort dialog active to false')
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