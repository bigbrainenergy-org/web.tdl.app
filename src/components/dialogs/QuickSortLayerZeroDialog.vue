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
          <SettingsButton
            v-model:settings="quickSortSettings"
            name="Quick Sort Settings"
            color="white"
          />
          <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
        </p>
      </q-card-section>
      <q-linear-progress v-if="loading" query stripe size="10px" />
      <q-card-section class="q-ma-lg vertical-top">
        <q-btn-dropdown
          :disable="loading"
          size="lg"
          color="positive"
          style="width: 100%"
          split
          auto-close
          dropdown-icon="more_vert"
          @click.stop="addRule(currentPair.data.a as Task, currentPair.data.b as Task)"
          @touchstart.stop
          @mousedown.stop
        >
          <template #label>
            <q-item-section class="vertical-top">
              <q-item-label lines="2" class="wrapped" :style="style">
                {{ currentPair.data.a.title }}
              </q-item-label>
            </q-item-section>
          </template>
          <q-list>
            <q-item
              v-for="(menuitem, index) in menuItems"
              :key="index"
              v-close-popup
              clickable
              @click.stop="menuitem.action(currentPair.data.a as Task)"
            >
              <q-item-label lines="1">{{ menuitem.label }}</q-item-label>
              <q-space />
              <q-icon :name="menuitem.icon" />
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-card-section>
      <q-card-section class="q-ma-lg vertical-top">
        <q-btn-dropdown
          :disable="loading"
          size="lg"
          color="positive"
          style="width: 100%"
          split
          auto-close
          dropdown-icon="more_vert"
          @click.stop="addRule(currentPair.data.b as Task, currentPair.data.a as Task)"
          @touchstart.stop
          @mousedown.stop
        >
          <template #label>
            <q-item-section class="vertical-top">
              <q-item-label lines="2" class="wrapped" :style="style">
                {{ currentPair.data.b.title }}
              </q-item-label>
            </q-item-section>
          </template>
          <q-list>
            <q-item
              v-for="(menuitem, index) in menuItems"
              :key="index"
              v-close-popup
              clickable
              @click.stop="menuitem.action(currentPair.data.b as Task)"
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
  import { useRepo } from 'pinia-orm'
  import { Notify, useDialogPluginComponent } from 'quasar'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { Task, TaskRepo } from 'src/stores/tasks/task'
  import { TDLAPP } from 'src/TDLAPP'
  import { SimpleMenuItem } from 'src/types'
  import { Utils } from 'src/util'
  import { onMounted, watch } from 'vue'
  import { computed, ref } from 'vue'
  import SettingsButton from '../SettingsButton.vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { timeThis, timeThisAABAsync } from 'src/perf'
  import { useElementSize } from '@vueuse/core'
  import { AxiosError } from 'axios'
  import { TaskCache } from 'src/stores/performance/task-go-fast'
  import { useAllTasksStore, cachedTask } from 'src/stores/performance/all-tasks'
import { useLayerZeroStore } from 'src/stores/performance/layer-zero'

  const props = withDefaults(defineProps<{ objective?: number }>(), {
    objective: 1
  })

  const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent()
  const emit = defineEmits([...useDialogPluginComponent.emits])

  const tr = useRepo(TaskRepo)
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

  // todo: storeToRefs
  const disableQuickSort = ref<boolean>(useLocalSettingsStore().disableQuickSort)
  const deepQuickSort = ref<boolean>(useLocalSettingsStore().enableDeeperQuickSort)
  const maxLayerZero = ref<number>(useLocalSettingsStore().enableQuickSortOnLayerZeroQTY)
  const quickSortNew = ref<boolean>(useLocalSettingsStore().enableQuickSortOnNewTask)
  const quickSortSettings = ref({
    'Disable Quick Sort': disableQuickSort,
    'Deeper Quick Sort': deepQuickSort,
    'Max Quantity of Next-Up Tasks': maxLayerZero,
    'Quick Sort on Any Task w/o Postreqs': quickSortNew
  })
  watch(disableQuickSort, () => {
    useLocalSettingsStore().disableQuickSort = disableQuickSort.value
  })
  watch(deepQuickSort, () => {
    useLocalSettingsStore().enableDeeperQuickSort = deepQuickSort.value
  })
  watch(maxLayerZero, () => {
    useLocalSettingsStore().enableQuickSortOnLayerZeroQTY = maxLayerZero.value + 0 // bug where this randomly gets cast as a boolean and can't be coerced back to number type on mobile. this might not work, idk. throwing stuff at the wall.
  })
  watch(quickSortNew, () => {
    useLocalSettingsStore().enableQuickSortOnNewTask = quickSortNew.value
  })

  const postWeightedTask = (x: cachedTask) => new PostWeightedTask(x.t)
  const postWeightedTask2 = (x: Task) => new PostWeightedTask(x)

  const layerZero = computed(() => {
    const layerZeroTasks = useLayerZeroStore().typed
    TaskCache.checkAgainstKnownCompletedTasks(...layerZeroTasks.map(x => x.t))
    return layerZeroTasks.map(postWeightedTask)
  })
  const tasksWithoutPostreqs = computed(() =>
    layerZero.value.filter((x) => !x.t.hasIncompletePostreqs)
  )
  const l0len = computed(() => layerZero.value.length)
  watch(l0len, (value: number) => {
    if (value < 2) {
      if (dialogRef !== null) onDialogOK()
    }
  })

  const layerOne = computed(() =>
    deepQuickSort.value
      ? layerZero.value
          .filter((x) => x.t.grabPostreqs(true).length > 1)
          .map((x) => ({
            id: x.t.id,
            data: x.t.grabPostreqs(true).map(postWeightedTask2)
          }))
      : null
  )

  const eq = (pairA: pair<Task>, pairB: pair<PostWeightedTask>): boolean => {
    if (pairA.a.id === pairB.a.t.id) {
      if (pairA.b.id === pairB.b.t.id) return true
    }
    if (pairA.a.id === pairB.b.t.id) {
      if (pairA.b.id === pairB.a.t.id) return true
    }
    return false
  }

  const loading = ref(false)

  type pair<T> = { a: T; b: T }
  let skippedPairs: pair<Task>[] = []

  const addPres = (x: Task) => {
    TDLAPP.addPrerequisitesDialog(x)
      .onOk(() => {
        console.log('getting a new pair now')
        skip()
      })
      .onCancel(() => {
        console.log('getting a new pair now')
        skip()
      })
      .onDismiss(() => {
        console.log('getting a new pair now')
        skip()
      })
  }

  const sliceTask = (x: Task) => {
    TDLAPP.sliceTask(x)
      .onOk(() => {
        console.log('getting a new pair now')
        skip()
      })
      .onCancel(() => {
        console.log('getting a new pair now')
        skip()
      })
      .onDismiss(() => {
        console.log('getting a new pair now')
        skip()
      })
  }

  const reloadTasks = () => {
    tryNewPair()
  }

  const complete = async (x: Task) => {
    try {
      const result = await x.toggleCompleted()
      if (result.completed === false) throw new Error('somehow task was not marked as complete.')
      reloadTasks()
      return result
    } catch (error: any) {
      Notify.create('Failed to mark the task complete.')
      console.error(error)
    }
  }
  const taskDetails = (x: Task) => {
    console.debug(`opening details for task ID ${x.id}`)
    TDLAPP.openTask(x).onCancel(reloadTasks).onDismiss(reloadTasks).onOk(reloadTasks)
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
    }
  ]

  const finishedSorting = (msg = 'Finished Sorting') => {
    Utils.notifySuccess(msg)
    useLoadingStateStore().busy = false
    console.log('setting quick sort dialog active to false')
    useLoadingStateStore().quickSortDialogActive = false
    if (dialogRef !== null) onDialogHide()
  }

  type withID<T> = { id: number | null; data: T }

  let skippedLayerOnePairs: withID<pair<Task>[]>[] = []

  const getSkippedPairsForID = (id: number | null): pair<Task>[] => {
    if (id === null) return skippedPairs
    let tmp: withID<pair<Task>[]> | undefined = skippedLayerOnePairs.find((x) => x.id === id)
    if (typeof tmp === 'undefined') {
      tmp = { id, data: [] }
      skippedLayerOnePairs.push(tmp)
    }
    return tmp.data
  }

  const isSkipped = (item: withID<pair<PostWeightedTask>>) =>
    getSkippedPairsForID(item.id).some((x) => eq(x, item.data))

  const permutations = (arr: Array<any>) => 0.5 * arr.length * (arr.length - 1)

  const selectPair = (arr: withID<PostWeightedTask[]>): withID<pair<Task>> | null => {
    if (arr.data.length < 2) return null
    // todo: revamp the forget() function
    if (arr.data.length === 2) {
      const lastPair: pair<PostWeightedTask> = { a: arr.data[0], b: arr.data[1] }
      if (isSkipped({ id: arr.id, data: lastPair })) {
        console.warn('the last available pair in the array was already skipped. bailing out.')
        return null
      }
      if (lastPair.a.t.hasRelationTo(lastPair.b.t.id)) {
        console.warn('the last available pair in the array is redundant. bailing out.')
        return null
      }
      return { id: arr.id, data: { a: lastPair.a.t, b: lastPair.b.t } }
    }
    let ints: pair<number> = {
      a: Utils.getRandomInt(arr.data.length),
      b: Utils.getRandomInt(arr.data.length)
    }
    let totalPermutations = permutations(arr.data)
    let tmp: pair<PostWeightedTask> = {
      a: arr.data[ints.a],
      b: arr.data[ints.b]
    }
    const remakeTMP = () => {
      tmp = {
        a: arr.data[ints.a],
        b: arr.data[ints.b]
      }
    }
    const rotate = (x: number, reverse = false) => {
      reverse ? x-- : x++
      if (x >= arr.data.length) x = 0
      else if (x < 0) x = arr.data.length - 1
      return x
    }
    let maxRolls = 10
    let permutationDecrementor = totalPermutations
    const wompwomp = (mode: 'rolls' | 'permutations') => {
      remakeTMP()
      if (mode === 'rolls') maxRolls--
      else permutationDecrementor--
    }
    const sameElements = (p: pair<number>) => p.a === p.b
    const redundant = (p: pair<PostWeightedTask>) =>
      tmp.a.t.hasRelationTo(tmp.b.t.id, { incompleteOnly: true, useStore: true })
    const loopConditions = () => {
      const se = sameElements(ints)
      const sk = isSkipped({ id: arr.id, data: tmp })
      const rd = redundant(tmp)
      return se || sk || rd
    }

    while (loopConditions() && permutationDecrementor > 0) {
      console.debug('in main loop of selectPair')
      while (sameElements(ints) && permutationDecrementor > 0) {
        console.log('accidentally made a pair where a and b are the same!')
        ints.b = rotate(ints.b)
        wompwomp('permutations')
      }
      while (isSkipped({ id: arr.id, data: tmp }) && permutationDecrementor > 0) {
        console.log('skipping skipped pair!')
        ints.a = rotate(ints.a, true)
        wompwomp('permutations')
      }
      while (maxRolls > 0 && tmp.a.shouldReroll()) {
        console.log('rerolling a!')
        ints.a = rotate(ints.a, true)
        wompwomp('rolls')
      }
      while (maxRolls > 0 && tmp.b.shouldReroll()) {
        console.log('rerolling b!')
        ints.b = rotate(ints.b)
        wompwomp('rolls')
      }
      console.debug({ tmp })
      while (redundant(tmp) && permutationDecrementor > 0) {
        console.log('found a redundant pair!', { tmp })
        ints.a = rotate(ints.a, true)
        wompwomp('permutations')
      }
    }

    if (permutationDecrementor <= 0) return null
    console.debug({
      permutationDecrementor,
      maxRolls,
      tmp,
      redundant: redundant(tmp)
    })
    return { id: arr.id, data: { a: tmp.a.t, b: tmp.b.t } }
  }

  const generateNewPair = (): withID<pair<Task>> => {
    // todo: if selecting a layer one task, cannot currently fallback to layer zero when all are skipped, and vice versa.
    console.log(`layer zero length is ${l0len.value}; objective is ${props.objective}`)
    const metLayerZeroLengthObjective = l0len.value <= props.objective
    const metNewTaskObjective =
      (tasksWithoutPostreqs.value.length === 0 && quickSortNew.value) || !quickSortNew.value
    if (metLayerZeroLengthObjective && metNewTaskObjective) {
      throw new Error('reached layer zero length objective.')
    }
    let tmp: withID<pair<Task>> | null = null
    const tryGetLayerOnePair = () => {
      if (layerOne.value === null || layerOne.value.length === 0) return null
      let randomindex = Utils.getRandomInt(layerOne.value.length)
      console.debug({ randomindex })
      let randomlySelectedPostsList = layerOne.value[randomindex]
      console.debug({ randomlySelectedPostsList })
      let attemptsRemaining = layerOne.value.length
      console.debug({ attemptsRemaining })
      while (
        permutations(randomlySelectedPostsList.data) -
          getSkippedPairsForID(randomlySelectedPostsList.id).length <
          1 &&
        attemptsRemaining > 0
      ) {
        console.log('all posts pairs are skipped now, moving to a new posts array.')
        console.debug({
          permutations: permutations(randomlySelectedPostsList.data),
          skippedPairs: getSkippedPairsForID(randomlySelectedPostsList.id),
          attemptsRemaining,
          randomindex
        })
        randomindex++
        attemptsRemaining--
        if (randomindex >= layerOne.value.length) randomindex = 0
        randomlySelectedPostsList = layerOne.value[randomindex]
      }
      if (attemptsRemaining < 1) {
        console.warn('selecting a layer one task pair did not work.')
        return null
      }
      return selectPair(randomlySelectedPostsList)
    }
    if (layerOne.value !== null && Math.random() > 0.4 && layerOne.value.length > 0) {
      console.debug('generating layer one pair!')
      tmp = tryGetLayerOnePair()
      if (tmp !== null) {
        return tmp
      }
      console.warn('falling back to selecting a layer zero task pair.')
    }
    console.debug('generating a layer zero pair!')
    tmp = selectPair({ id: null, data: layerZero.value })
    if (tmp !== null) return tmp
    throw new Error('Could not generate a new pair')
  }

  let firstPair
  try {
    firstPair = generateNewPair()
  } catch (e: any) {
    console.log(e)
    finishedSorting()
  }
  if (firstPair === null || typeof firstPair === 'undefined')
    throw new Error('Could not generate first pair')
  const currentPair = ref<withID<pair<Task>>>(firstPair)

  const forget = (id: number) => {
    const idInSkippedPair = (x: pair<Task>) => x.a.id !== id && x.b.id !== id
    skippedLayerOnePairs = skippedLayerOnePairs.map((x) => ({
      id: x.id,
      data: x.data.filter(idInSkippedPair)
    }))
    skippedPairs = skippedPairs.filter(idInSkippedPair)
  }

  const tryNewPair = () => {
    try {
      currentPair.value = generateNewPair()
    } catch (e) {
      Utils.notifySuccess('Nothing more to sort')
      if (dialogRef !== null) onDialogOK()
    }
  }

  const addRule = async (first: Task, second: Task) => {
    console.debug({ first, second })
    loading.value = true
    await timeThisAABAsync(
      TDLAPP.addPre,
      'add rule on quick sort dialog',
      1000
    )(second, first.id).then(() => {
      forget(second.id)
      timeThis(tryNewPair, 'tryNewPair', 100)()
      loading.value = false
    })
  }

  const skip = () => {
    getSkippedPairsForID(currentPair.value.id).push({
      a: currentPair.value.data.a as Task,
      b: currentPair.value.data.b as Task
    })
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
