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
              <q-icon v-if="aboves.get(item.id) === true" name='fas fa-triangle-exclamation' color="green" />
              <q-icon v-if="belows.get(item.id) === true" name='fas fa-triangle-exclamation' color="red" />
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
import { useAllTasksStore } from 'src/stores/performance/all-tasks'
import { Task } from 'src/stores/tasks/task'
import { ID, SimpleMenuItem, λ } from 'src/types'
import { onMounted, onUpdated, ref } from 'vue'

export interface EntityType {
  singular: string
  plural: string
}

interface Props {
  items: Array<Task>
  dependencyType: EntityType // eg. Prerequisites (capitalize)
  menuItems: Array<SimpleMenuItem<Task>>
  showPrune: boolean
}

const prop = defineProps<Props>()

const addItemLabel = `Add ${prop.dependencyType.plural}`

const emit = defineEmits([ 'addItem', 'removeItem', 'selectItem', 'toggleCompletedItem', 'pruneDependencies' ])

const updateRedundants = () => {
  console.time('updateRedundants')
  if(prop.items.length === 0) return
  console.warn(`updating redundant check for ${prop.items.length} dependents`)
  const arr = prop.items.map(x => x.id)
  useAllTasksStore().regenerate()
  const options = { incompleteOnly: useLocalSettingsStore().hideCompleted, useStore: true }
  prop.items.forEach(x => {
    const arrExcludingX = arr.filter(y => y !== x.id && aboves.value.get(y) !== true && belows.value.get(y) !== true)
    const otherDepsAbove = x.anyIDsAbove(arrExcludingX, options)
    const otherDepsBelow = x.anyIDsBelow(arrExcludingX, options)
    otherDepsAbove.forEach((val, key) => {
      if(val) {
        belows.value.set(x.id, true)
        aboves.value.set(key, val)
      }
    })
    otherDepsBelow.forEach((val, key) => {
      if(val) {
        aboves.value.set(x.id, true)
        belows.value.set(key, val)
      }
    })
  })
  console.timeEnd('updateRedundants')
}

const aboves = ref<Map<ID, boolean>>(new Map())
const belows = ref<Map<ID, boolean>>(new Map())
onMounted(updateRedundants)
onUpdated(updateRedundants)

const pruneDependencies = () => { emit('pruneDependencies', { above: aboves.value, below: belows.value })}
</script>

<style>
.wrapped {
  word-break: break-spaces;
  white-space: break-spaces !important;
}
</style>