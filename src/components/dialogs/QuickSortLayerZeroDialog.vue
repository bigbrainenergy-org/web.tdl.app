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
          <q-btn icon="fa-solid fa-gear" class="text-white">
            <q-popup-proxy class="q-pa-md">
              <q-item-section>
                <q-item-label lines="2">{{ 'Settings' }}</q-item-label>
              </q-item-section>
              <GloriousToggle v-model:model-value="disableQuickSort" label="Disable Quick Sort" />
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
          <li v-for="t of currentPair" :key="t.id" class="q-ma-lg vertical-middle" style="display: flex" color="positive" :disable="loading">
            <q-avatar rounded icon="fa-solid fa-arrows-up-down" class="drag-me q-my-sm" color="primary" />
            <q-item clickable>
              <q-item-section class="vertical-top" @click.stop="makeSelection(t as Task)">
                <q-item-label lines="2" class="wrapped" :style="style">
                  {{ t.title }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  :disable="loading"
                  icon="more_vert"
                  size="lg"
                  color="white"
                  auto-close
                  @touchstart.stop
                  @mousedown.stop
                >
                  <q-menu>
                    <q-list>
                      <q-item
                        v-for="(menuitem, index) in menuItems"
                        :key="index"
                        v-close-popup
                        clickable
                        @click.stop="menuitem.action(t as Task)"
                      >
                        <q-item-label lines="1">{{ menuitem.label }}</q-item-label>
                        <q-space />
                        <q-icon :name="menuitem.icon" />
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-item-section>
            </q-item>
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
  import { Notify, useDialogPluginComponent } from 'quasar'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { nextTick, onMounted, watch } from 'vue'
  import { computed, ref } from 'vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { useElementSize } from '@vueuse/core'
  import GloriousSlider from 'src/components/glorious/GloriousSlider.vue'
  import GloriousToggle from 'src/components/glorious/GloriousToggle.vue'
  import { storeToRefs } from 'pinia'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import { notifySuccess } from 'src/utils/notification-utils'
  import type { SimpleMenuItem } from 'src/utils/types'
  import { addPrerequisitesDialog, openTaskSlicerDialog, openUpdateTaskDialog } from 'src/utils/dialog-utils'
  import { dragAndDrop, useDragAndDrop } from '@formkit/drag-and-drop/vue'
  import { Logger } from 'src/utils/d'

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
    // enableDeeperQuickSort,
    enableQuickSortOnLayerZeroQTY,
    // enableQuickSortOnNewTask,
    quickSortDialogMaxToShow,
    enableQuickSortBailOnBigTask,
    quickSortBailOnTaskSize
  } = storeToRefs(useLocalSettingsStore())

  const postWeightedTask = (x: Task) => new PostWeightedTask(x)

  const lzerotasks = useTaskStore().layerZero

  const layerZero = computed(() => lzerotasks.value.map(postWeightedTask))
  const tasksWithoutPostreqs = computed(() =>
    layerZero.value.filter((x) => !(x.t.grabPostreqs(true).length > 0))
  )
  const l0len = computed(() => layerZero.value.length)
  watch(l0len, (value: number) => {
    if (value < 2) {
      if (dialogRef !== null) onDialogOK()
    }
  })

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

  const addPres = (x: Task) => {
    addPrerequisitesDialog(x)
      .onOk(() => {
        quickSortLogger.debug('getting a new pair now')
        skip()
      })
      .onCancel(() => {
        quickSortLogger.debug('getting a new pair now')
        skip()
      })
      .onDismiss(() => {
        quickSortLogger.debug('getting a new pair now')
        skip()
      })
  }

  const sliceTask = (x: Task) => {
    openTaskSlicerDialog(x)
      .onOk(() => {
        quickSortLogger.debug('getting a new pair now')
        skip()
      })
      .onCancel(() => {
        quickSortLogger.debug('getting a new pair now')
        skip()
      })
      .onDismiss(() => {
        quickSortLogger.debug('getting a new pair now')
        skip()
      })
  }

  const reloadTasks = () => {
    tryNewPair()
  }

  const complete = async (x: Task) => {
    try {
      await x.toggleCompleted()
      reloadTasks()
    } catch (error: any) {
      Notify.create('Failed to mark the task complete.')
      quickSortLogger.error(error)
    }
  }
  const taskDetails = (x: Task) => {
    quickSortLogger.debug(`opening details for task ID ${x.id}`)
    openUpdateTaskDialog(x).onCancel(reloadTasks).onDismiss(reloadTasks).onOk(reloadTasks)
  }

  const doASAP = (mvp: Task) => {
    loading.value = true
    const allOtherLayerZero = layerZero.value.filter((x: PostWeightedTask) => x.t.id !== mvp.id)
    // TODO: write a bulk_add_posts action on the model
    mvp.hard_postreq_ids.push(...allOtherLayerZero.map((x: PostWeightedTask) => x.t.id))
    allOtherLayerZero.forEach((x: PostWeightedTask) => {
      x.t.hard_prereq_ids.push(mvp.id)
    })
    useTaskStore()
      .apiUpdate(mvp.id, { hard_postreq_ids: mvp.hard_postreq_ids })
      .then(async () => {
        await tryNewPair()
        loading.value = false
      })
  }

  const menuItems: SimpleMenuItem<Task>[] = [
    {
      label: 'Mark Complete',
      icon: 'fa-solid fa-clipboard-check',
      action: complete
    },
    {
      label: 'Details',
      icon: 'fa-solid fa-circle-info',
      action: taskDetails
    },
    {
      label: 'Slice Into Pieces',
      icon: 'fa-solid fa-scissors',
      action: sliceTask
    },
    {
      label: 'Add Prerequisite',
      icon: 'fa-solid fa-square-plus',
      action: addPres
    },
    {
      label: 'Do This ASAP',
      icon: 'fa-solid fa-fire',
      action: doASAP
    }
  ]

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
    if (enableQuickSortBailOnBigTask.value) {
      if (
        layerZero.value.filter(
          (x) => x.t.grabPostreqs(true).length > quickSortBailOnTaskSize.value
        ).length > 0
      )
        throw new Error('There is already a layer zero task that is big')
    }
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

  const makeSelection = (mvp: Task) => {
    loading.value = true
    const selected_tasks = currentPair.value.filter((x) => x.id !== mvp.id)
    const selected_ids = selected_tasks.map((x) => x.id)
    mvp.hard_postreq_ids.push(...selected_ids)
    selected_tasks.forEach((x) => {
      x.hard_prereq_ids.push(mvp.id)
    })
    useTaskStore()
      .apiUpdate(mvp.id, { hard_postreq_ids: mvp.hard_postreq_ids })
      .then(async () => {
        await tryNewPair()
        loading.value = false
      })
  }

  const confirmOrder = async () => {
    loading.value = true
    for(let i = 1; i < currentPair.value.length; i++) {
      const a = currentPair.value[i-1]!
      const b = currentPair.value[i]!
      // todo use a batch update api call.
      await useTaskStore().addRule(a.id, b.id)
        .then(() => quickSortLogger.log(`successful api update: {${a.title.substring(0, 80)}} => {${b.title.substring(0, 80)}}`))
    }
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

  const el = ref()
  const { width } = useElementSize(el)
  // fixme - I could not get q-item-label lines="x" to work in dynamic-width parent elements. This is a workaround to bind a px width.
  const style = computed(() => {
    //margins are 2(24+16) = 80px
    //dropdown section is 35px; total is 115px.

    const five_percent = width.value / 20

    return {
      width: `${width.value - 152 - five_percent}px`,
      'max-width': `${width.value - 152 - five_percent}px`
    }
  })
</script>

<style>
  .wrapped {
    word-break: break-spaces;
    white-space: break-spaces !important;
  }
</style>