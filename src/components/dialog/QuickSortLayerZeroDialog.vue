<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Quick Arrange Next Actions</div>
        <div class="text-h6">Which task should come first?</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
      </q-card-section>
      <q-linear-progress query v-if="loading" stripe size="10px" />
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
          <template v-slot:label>
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
          <template v-slot:label>
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

<style>
.wrapped {
  word-break: break-spaces;
  white-space: break-spaces !important;
}
</style>

<script setup lang="ts">
import { useRepo } from 'pinia-orm'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { TDLAPP } from 'src/TDLAPP'
import { SimpleMenuItem } from 'src/types'
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

const $q = useQuasar()

const addPres = (x: Task) => {
  TDLAPP.addPrerequisitesDialog(x, $q)
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