<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Quick Arrange Next Actions</div>
        <div class="text-h6">Which task should come first?</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
      </q-card-section>
      <q-linear-progress query v-if="loading" stripe size="10px" />
      <q-card-section>
        <q-btn :disable="loading" class="q-ma-lg" size="lg" color="positive" :label="currentPair.a.title" @click="addRule(currentPair.a as Task, currentPair.b as Task)" />
      </q-card-section>
      <q-card-section>
        <q-btn :disable="loading" class="q-ma-lg" size="lg" color="positive" :label="currentPair.b.title" @click="addRule(currentPair.b as Task, currentPair.a as Task)" />
      </q-card-section>
      <q-card-section>
        <q-btn :disable="loading" class="q-ma-lg" size="lg" color="grey" label="SKIP" @click="skip" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useRepo } from 'pinia-orm'
import { useDialogPluginComponent } from 'quasar'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { TDLAPP } from 'src/TDLAPP'
import { Utils } from 'src/util'
import { computed, ref } from 'vue'

const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const tr = computed(() => useRepo(TaskRepo))
const layerZero = computed(() => tr.value.layerZero())

const eq = (pairA: pair<Task>, pairB: pair<Task>): boolean => {
  return (pairA.a.id === pairB.a.id || pairA.a.id === pairB.b.id)
  && (pairA.b.id === pairB.b.id || pairA.b.id === pairB.a.id)
}

const loading = ref(false)

type pair<T> = { a: T, b: T }
const skippedPairs = ref<pair<Task>[]>([])

const newPair = (): pair<Task> => {
  console.debug(`permutations remaining: ${unskippedPermutations.value}`)
  if(layerZero.value.length < 2) throw new Error('Nothing more to sort')
  if(layerZero.value.length === 2) {
    Utils.notifySuccess('These are the last two tasks!')
    return {
      a: layerZero.value[0],
      b: layerZero.value[1]
    }
  }
  const debugpair = (pair: pair<Task>, msg: string, len = 30) => {
    console.debug(msg, '\n', pair.a.id, ':', pair.a.title.slice(0, len), ' <--> ', pair.b.id, ':', pair.b.title.slice(0, len))
  }
  const generatePairNotYetSkipped = () => {
    let ints: pair<number> = {
      a: Utils.getRandomInt(layerZero.value.length),
      b: Utils.getRandomInt(layerZero.value.length)
    }
    let left = permutations.value
    let tmp: pair<Task> = {
      a: layerZero.value[ints.a],
      b: layerZero.value[ints.b]
    }
    debugpair(tmp, 'initial pair')
    const remakeTMP = () => {
      tmp = {
        a: layerZero.value[ints.a],
        b: layerZero.value[ints.b]
      }
    }
    while(ints.a === ints.b || skippedPairs.value.some(x => eq(x as pair<Task>, tmp)) && left > 0) {
      while(ints.a === ints.b && left > 0) {
        debugpair(tmp, 'a and b were equal')
        ints.b++
        if(ints.b >= layerZero.value.length) ints.b = 0
        remakeTMP()
        left--
      }
      while(skippedPairs.value.some(x => eq(x as pair<Task>, tmp)) && left > 0) {
        debugpair(tmp, 'this pair was already in the skipped list')
        ints.a--
        if(ints.a < 0) ints.a = layerZero.value.length - 1
        remakeTMP()
        left--
      }
    }
    if(left <= 0) throw new Error('Could not find a pair')
    return tmp
  }
  let tasks = generatePairNotYetSkipped()
  debugpair(tasks, 'this pair works')
  return tasks
}

const permutations = computed(() => 0.5 * layerZero.value.length * (layerZero.value.length - 1))
const unskippedPermutations = computed(() => permutations.value - skippedPairs.value.length - 1)

const currentPair = ref<pair<Task>>(newPair())

const forget = (id: number) => {
  skippedPairs.value = skippedPairs.value.filter(x => x.a.id !== id && x.b.id !== id)
}

const tryNewPair = () => {
  try {
    currentPair.value = newPair()
  } catch(e) {
    Utils.notifySuccess('Nothing more to sort')
    onDialogOK()
  }
}

const addRule = async (first: Task, second: Task) => {
  loading.value = true
  await TDLAPP.addPost(first, second.id)
  .then(() => {
    forget(second.id)
    tryNewPair()
    loading.value = false
  })
}

const skip = () => {
  skippedPairs.value.push({ a: currentPair.value.a, b: currentPair.value.b })
  tryNewPair()
}

const onCancelClick = onDialogOK

</script>