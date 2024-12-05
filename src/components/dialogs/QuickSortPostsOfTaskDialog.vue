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
      <q-card-section v-for="t of currentPair" :key="t.id" class="q-ma-lg vertical-top">
        <q-btn-dropdown
          :disable="loading"
          size="lg"
          color="positive"
          style="width: 100%"
          split
          auto-close
          dropdown-icon="more_vert"
          @click.stop="makeSelection(t as Task)"
          @touchstart.stop
          @mousedown.stop
        >
          <template #label>
            <q-item-section class="vertical-top">
              <q-item-label lines="2" class="wrapped" :style="style">
                {{ t.title }}
              </q-item-label>
            </q-item-section>
          </template>
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
        </q-btn-dropdown>
      </q-card-section>
      <q-card-section class="q-ma-lg vertical-top text-center">
        <q-btn
          :disable="loading"
          class="q-ma-lg"
          size="lg"
          color="grey"
          label="SKIP"
          @click="skip"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { Notify, useDialogPluginComponent } from 'quasar'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { onMounted, watch } from 'vue'
  import { computed, ref } from 'vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { useElementSize } from '@vueuse/core'
  import GloriousSlider from '../GloriousSlider.vue'
  import GloriousToggle from '../GloriousToggle.vue'
  import { storeToRefs } from 'pinia'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import { notifySuccess } from 'src/utils/notification-utils'
  import type { SimpleMenuItem } from 'src/utils/types'
  import { addPrerequisitesDialog, openTaskSlicerDialog, openUpdateTaskDialog } from 'src/utils/dialog-utils'
  import { hardCheck } from 'src/utils/type-utils'
  import { useTaskShortcuts } from 'src/composables/use-task-shortcuts'

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
    weight = () => 1 / Math.min(Math.max(1, this.t.incomplete_postreqs.length), 10)
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

  const postreqsToSort = computed(() => (parentTask.value.incomplete_postreqs as Task[]).map(postWeightedTask))

  // const layerZero = computed(() => {
  //   const layerZeroTasks = useTaskStore().layerZero
  //   return layerZeroTasks.map(postWeightedTask)
  // })
  const tasksWithoutPostreqs = computed(() =>
    postreqsToSort.value.filter((x) => !(x.t.incomplete_postreqs.length > 0))
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

  const addPres = (x: Task) => {
    addPrerequisitesDialog(x)
      .onOk(() => {
        console.debug('getting a new pair now')
        skip()
      })
      .onCancel(() => {
        console.debug('getting a new pair now')
        skip()
      })
      .onDismiss(() => {
        console.debug('getting a new pair now')
        skip()
      })
  }

  const sliceTask = (x: Task) => {
    openTaskSlicerDialog(x)
      .onOk(() => {
        console.debug('getting a new pair now')
        skip()
      })
      .onCancel(() => {
        console.debug('getting a new pair now')
        skip()
      })
      .onDismiss(() => {
        console.debug('getting a new pair now')
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
      console.error(error)
    }
  }
  const taskDetails = (x: Task) => {
    console.debug(`opening details for task ID ${x.id}`)
    openUpdateTaskDialog(x).onCancel(reloadTasks).onDismiss(reloadTasks).onOk(reloadTasks)
  }

  const doASAP = (mvp: Task) => {
    loading.value = true
    const allOtherLayerZero = postreqsToSort.value.filter((x: PostWeightedTask) => x.t.id !== mvp.id)
    // TODO: write a bulk_add_posts action on the model
    mvp.hard_postreq_ids.push(...allOtherLayerZero.map((x: PostWeightedTask) => x.t.id))
    // remove all the other tasks from parent task, leaving only the mvp id
    parentTask.value.hard_postreq_ids = [mvp.id]
    allOtherLayerZero.forEach((x: PostWeightedTask) => {
      x.t.hard_prereq_ids.push(mvp.id)
      const parentTaskIndex = x.t.hard_prereq_ids.findIndex(y => y === parentTask.value.id)
      if(parentTaskIndex >= 0) x.t.hard_prereq_ids.splice(parentTaskIndex, 1)
    })
    // todo: figure out what all we should save here.
    useTaskStore()
      .apiUpdate(mvp.id, { hard_postreq_ids: mvp.hard_postreq_ids })
      .then(() => {
        tryNewPair()
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
    throw new Error('Could not generate first pair')
  const currentPair = ref(firstPair)

  // const forget = (id: number) => {
  //   const idInSkippedPair = (x: pair<Task>) => x.a.id !== id && x.b.id !== id
  //   skippedLayerOnePairs = skippedLayerOnePairs.map((x) => ({
  //     id: x.id,
  //     data: x.data.filter(idInSkippedPair)
  //   }))
  //   skippedPairs = skippedPairs.filter(idInSkippedPair)
  // }

  const tryNewPair = () => {
    try {
      currentPair.value = generateNewPair()
    } catch (e) {
      notifySuccess('Nothing more to sort')
      if (dialogRef !== null) onDialogOK()
    }
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
    tryNewPair()
    loading.value = false
  }

  const skip = () => {
    tryNewPair()
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

  const el = ref()
  const { width } = useElementSize(el)
  // fixme - I could not get q-item-label lines="x" to work in dynamic-width parent elements. This is a workaround to bind a px width.
  const style = computed(() => {
    //margins are 2(24+16) = 80px
    //dropdown section is 35px; total is 115px.

    return {
      width: `${width.value - 152}px`,
      'max-width': `${width.value - 152}px`
    }
  })
</script>

<style>
  .wrapped {
    word-break: break-spaces;
    white-space: break-spaces !important;
  }
</style>