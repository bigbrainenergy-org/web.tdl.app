<template>
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Quick Arrange Next Actions</div>
        <div class="text-h6">Which task should come first?</div>
        <div class="text-h6">{{ layerZero.length }} Tasks to Prioritize</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
      </q-card-section>
      <q-linear-progress v-if="loading" query stripe size="10px" />
      <q-card-section class="q-ma-lg vertical-top">
        <q-btn-dropdown 
          :disable="loading"
          size="lg"
          color="positive"
          style="width: 100%;"
          split
          auto-close
          dropdown-icon="more_vert"
          @click.stop="addRule(currentPair.a as Task, currentPair.b as Task)">
          <template #label>
            <q-item-section class="vertical-top">
              <q-item-label lines="2" class="wrapped">
                {{ currentPair.a.title }}
              </q-item-label>
            </q-item-section>
          </template>
          <q-list>
            <q-item
              v-for="menuitem, index in menuItems"
              :key="index"
              v-close-popup
              clickable
              @click.stop="menuitem.action(currentPair.a as Task)">
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
          style="width: 100%;"
          split
          auto-close
          dropdown-icon="more_vert"
          @click.stop="addRule(currentPair.b as Task, currentPair.a as Task)">
          <template #label>
            <q-item-section class="vertical-top">
              <q-item-label lines="2" class="wrapped">
                {{ currentPair.b.title }}
              </q-item-label>
            </q-item-section>
          </template>
          <q-list>
            <q-item
              v-for="menuitem, index in menuItems"
              :key="index"
              v-close-popup
              clickable
              @click.stop="menuitem.action(currentPair.b as Task)">
              <q-item-label lines="1">{{ menuitem.label }}</q-item-label>
              <q-space />
              <q-icon :name="menuitem.icon" />
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-card-section>
      <q-card-section class="q-ma-lg vertical-top text-center">
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
import { SimpleMenuItem } from 'src/types'
import { Utils } from 'src/util'
import { watch } from 'vue'
import { computed, ref } from 'vue'
const emit = defineEmits([ ...useDialogPluginComponent.emits ])
const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent()

const tr = computed(() => useRepo(TaskRepo))

class PostWeightedTask {
  t: Task
  constructor(t: Task) {
    this.t = t
  }
  weight = () => 1/Math.min(Math.max(1, this.t.grabPostreqs(true).length), 10)
  shouldReroll = () => Math.random() - this.weight() > 0
}

const layerZero = computed(() => tr.value.layerZero().map(x => new PostWeightedTask(x)))
const l0len = computed(() => layerZero.value.length)
watch(l0len, (value: number) => {
  if(value < 2) onDialogOK()
})

const eq = (pairA: pair<Task>, pairB: pair<PostWeightedTask>): boolean => {
  if(pairA.a.id === pairB.a.t.id) {
    if(pairA.b.id === pairB.b.t.id) return true
  }
  if(pairA.a.id === pairB.b.t.id) {
    if(pairA.b.id === pairB.a.t.id) return true
  }
  return false
}

const loading = ref(false)

type pair<T> = { a: T, b: T }
const skippedPairs = ref<pair<Task>[]>([])

const addPres = (x: Task) => {
  TDLAPP.addPrerequisitesDialog(x)
  .onOk(     () => tryNewPair())
  .onCancel( () => tryNewPair())
  .onDismiss(() => tryNewPair())
}

const complete = (x: Task) => {
  tr.value.toggleCompleted(x)
  .then(() => {
    Utils.notifySuccess('Marked Complete!', 'fa-solid fa-clipboard-check')
    tryNewPair()
  })
}

const menuItems: SimpleMenuItem<Task>[] = [
  {
    label: 'Mark Complete',
    icon: 'fa-solid fa-clipboard-check',
    action: complete
  },
  {
    label: 'Add Prerequisite',
    icon: 'fa-solid fa-square-plus',
    action: addPres
  }
]

const determineLayerZeroStatus = () => {
  if(useRepo(TaskRepo).layerZero().length < 2) {
    Utils.notifySuccess('Nothing more to sort')
    onDialogHide()
  }
}

const newPair = (): pair<Task> => {
  console.debug(`permutations remaining: ${unskippedPermutations.value}`)
  determineLayerZeroStatus()
  if(layerZero.value.length === 2) {
    return {
      a: layerZero.value[0].t,
      b: layerZero.value[1].t
    }
  }
  const debugpair = (pair: pair<PostWeightedTask>, msg: string, len = 30) => {
    console.debug(msg, '\n', pair.a.t.id, ':', pair.a.t.title.slice(0, len), ' <--> ', pair.b.t.id, ':', pair.b.t.title.slice(0, len))
  }
  const generatePairNotYetSkipped = (): pair<PostWeightedTask> => {
    let ints: pair<number> = {
      a: Utils.getRandomInt(layerZero.value.length),
      b: Utils.getRandomInt(layerZero.value.length)
    }
    let left = permutations.value
    let tmp: pair<PostWeightedTask> = {
      a: layerZero.value[ints.a],
      b: layerZero.value[ints.b]
    }
    // debugpair(tmp, 'initial pair')
    const remakeTMP = () => {
      tmp = {
        a: layerZero.value[ints.a],
        b: layerZero.value[ints.b]
      }
    }
    const rotate = (x: number, reverse = false) => {
      reverse ? x-- : x++
      if(x >= layerZero.value.length) x = 0
      else if(x < 0) x = layerZero.value.length - 1
      return x
    }
    let maxRolls = 10
    while((ints.a === ints.b || skippedPairs.value.some(x => eq(x as pair<Task>, tmp))) && left > 0) {
      console.debug('in the loop')
      while(ints.a === ints.b && left > 0) {
        debugpair(tmp, 'a and b were equal')
        ints.b = rotate(ints.b)
        remakeTMP()
        left--
      }
      while(skippedPairs.value.some(x => eq(x as pair<Task>, tmp)) && left > 0) {
        debugpair(tmp, 'this pair was already in the skipped list')
        ints.a = rotate(ints.a, true)
        remakeTMP()
        left--
      }
      while(maxRolls > 0 && tmp.a.shouldReroll()) {
        console.debug('rerolling a')
        ints.a = rotate(ints.a, true)
        remakeTMP()
        maxRolls--
      }
      while(maxRolls > 0 && tmp.b.shouldReroll()) {
        console.debug('rerolling b')
        ints.b = rotate(ints.b)
        remakeTMP()
        maxRolls--
      }
    }
    if(left <= 0) throw new Error('Could not find a pair')
    return tmp
  }
  let tasks = generatePairNotYetSkipped()
  // debugpair(tasks, 'this pair works')
  return { a: tasks.a.t, b: tasks.b.t }
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
  await TDLAPP.addPre(second, first.id)
  .then(() => {
    forget(second.id)
    determineLayerZeroStatus()
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

<style>
.wrapped {
  word-break: break-spaces;
  white-space: break-spaces !important;
}
</style>