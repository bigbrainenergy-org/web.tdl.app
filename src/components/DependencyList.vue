<template>
  <div>
    <div class="row">
      <div class="col">
        <div class="text-h5">{{ dependencyType.plural }}</div>
      </div>
      <q-btn v-if="showPrune" @click="pruneDependencies">Prune {{ dependencyType.plural }}</q-btn>
      <div class="col text-right">
        <q-btn color="primary" icon="fas fa-link" :label="addItemLabel" @click="emit('addItem')" />
      </div>
    </div>
    <div class="col-grow">
      
    <q-list class="q-my-md">
      <q-item v-if="!items.length" v-ripple>
        <q-item-section>No {{ dependencyType.plural }}</q-item-section>
      </q-item>
      <q-item
        v-for="item, itemkey in items"
        :key="itemkey"
        v-ripple>
        <q-btn-dropdown
          style="width: 100%;"
          split 
          auto-close
          dropdown-icon="more_vert" 
          @click.stop="emit('selectItem', item)">
          <template #label>
            <q-item-section avatar style="width: 10%;">
              <q-checkbox v-model:model-value="item.completed" @update:model-value="emit('toggleCompletedItem', item)"/>
            </q-item-section>
            <q-item-section class="vertical-top wrapped" style="width: 90%;">
              <q-icon v-if="isNearRedundant(item.id)" name='fas fa-triangle-exclamation' color="green" />
              <q-icon v-if="isFarRedundant(item.id)" name='fas fa-triangle-exclamation' color="red" />
              <q-item-label lines="2">
                {{ item.title }}
              </q-item-label>
            </q-item-section>
          </template>
          <q-list>
            <q-item
            v-for="menuitem, index in menuItems"
            :key="index"
            v-close-popup
            clickable
            @click.stop="menuitem.action(item)">
              <q-item-label lines="1">{{ menuitem.label }}</q-item-label>
              <q-space />
              <q-icon :name="menuitem.icon" />
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-item>
    </q-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { useLoadingStateStore } from 'src/stores/performance/loading-state'
import { Task } from 'src/stores/tasks/task'
import { SimpleMenuItem, λ } from 'src/types'
import { computed, onMounted } from 'vue'
import { onUpdated } from 'vue'
import { ref } from 'vue'

export interface EntityType {
  singular: 'Prerequisite' | 'Postrequisite'
  plural: 'Prerequisites' | 'Postrequisites'
}

interface Props {
  items: Array<Task>
  dependencyType: EntityType // eg. Prerequisites (capitalize)
  menuItems: Array<SimpleMenuItem<Task>>
  showPrune: boolean
}

const prop = defineProps<Props>()

// can do something like this to limit recalculations, especially when setting a task as MVP
// const act = (action: (inputArgument: Task) => void | Promise<void | Task>, inputArgument: Task) => {
//   action(inputArgument)
//   updateRedundants()
// }

const addItemLabel = `Add ${prop.dependencyType.plural}`

const emit = defineEmits([ 'addItem', 'removeItem', 'selectItem', 'toggleCompletedItem', 'pruneDependencies' ])

const busySignal = computed(() => useLoadingStateStore().busy)

const updateRedundants = () => {
  if(busySignal.value) return
  const start = performance.now()
  aboves.value.clear()
  belows.value.clear()
  if(prop.items.length === 0) return
  // console.warn(`updating redundant check for ${prop.items.length} dependents`)
  const arr = prop.items.map(x => x.id)
  const options = { incompleteOnly: useLocalSettingsStore().hideCompleted, useStore: true }
  prop.items.forEach(x => {
    const arrExcludingX = arr.filter(y => y !== x.id && !belows.value.has(y) && !aboves.value.has(y))
    const aboveX = x.anyIDsAbove(arrExcludingX, options)
    const belowX = x.anyIDsBelow(arrExcludingX, options)
    aboveX.forEach((val, key) => { 
      if(val) aboves.value.add(key)
    })
    belowX.forEach((val, key) => { 
      if(val) belows.value.add(key)
    })
    // console.debug({ x, arrExcludingX, aboveX, belowX })
  })
  const duration = performance.now() - start
  if(duration > 50) console.warn(`updateRedundants took ${Math.floor(duration)}ms`)
}

const aboves = ref<Set<number>>(new Set())
const belows = ref<Set<number>>(new Set())
onMounted(updateRedundants)
onUpdated(updateRedundants)

const isNearRedundant = (x: number) => {
  return prop.dependencyType.singular === 'Prerequisite' ? belows.value.has(x) : aboves.value.has(x)
}
const isFarRedundant = (x: number) => {
  return prop.dependencyType.singular === 'Prerequisite' ? aboves.value.has(x) : belows.value.has(x)
}

const pruneDependencies = () => {
  console.log(`pruning ${prop.dependencyType.plural}`)
  emit('pruneDependencies', { above: aboves.value, below: belows.value })
}
</script>

<style>
.wrapped {
  word-break: break-spaces;
  white-space: break-spaces !important;
}
</style>