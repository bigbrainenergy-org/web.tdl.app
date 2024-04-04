<template>
  <div>
    <div class="row">
      <div class="col">
        <div class="text-h5">{{ dependencyType.plural }}</div>
      </div>
      <div class="col text-right">
        <q-btn color="primary" icon="fas fa-link" :label="addItemLabel" @click="emit('addItem')" />
      </div>
    </div>
    <div class="col-grow">
      
    <q-list class="q-my-md">
      <q-item v-ripple v-if="!items.length">
        <q-item-section>No {{ dependencyType.plural }}</q-item-section>
      </q-item>
      <q-item
        v-ripple
        v-for="item, index in items"
        :key="index">
        <q-btn-dropdown style="width: 100%;"
          split 
          auto-close
          dropdown-icon="more_vert" 
          @click.stop="emit('selectItem', item)">
          <template v-slot:label>
            <q-item-section avatar style="width: 10%;">
              <q-checkbox v-model:model-value="item.completed" @update:model-value="emit('toggleCompletedItem', item)"/>
            </q-item-section>
            <q-item-section class="vertical-top wrapped" style="width: 90%;">
              <q-item-label lines="2" :style="colorize(item)">
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
import { SimpleMenuItem, λ } from 'src/types'
import { onMounted } from 'vue'
import { onUpdated } from 'vue'
import { ref } from 'vue'

export interface EntityType {
  singular: string
  plural: string
}

interface Props {
  items: Array<Task>
  dependencyType: EntityType // eg. Prerequisites (capitalize)
  menuItems: Array<SimpleMenuItem<Task>>
}

const prop = defineProps<Props>()

const addItemLabel = `Add ${prop.dependencyType.plural}`

const emit = defineEmits([ 'addItem', 'removeItem', 'selectItem', 'toggleCompletedItem' ])

const updateRedundants = () => {
  console.time('updateRedundants')
  redundantRules.value.clear()
  if(prop.items.length === 0) return
  console.warn(`updating redundant check for ${prop.items.length} dependents`)
  const arr = prop.items.map(x => x.id)
  useAllTasksStore().regenerate()
  prop.items.forEach(x => {
    const arrExcludingX = arr.filter(y => y !== x.id && !redundantRules.value.has(y))
    const results = x.BulkHasRelationTo(arrExcludingX, { incompleteOnly: useLocalSettingsStore().hideCompleted, useStore: true })
    results.forEach((val: boolean, key: number) => { if(val) redundantRules.value.add(key) })
  })
  console.timeEnd('updateRedundants')
}

//const colorize = (task: Task) => redu
const redundantRules = ref<Set<number>>(new Set<number>())
onMounted(updateRedundants)
onUpdated(updateRedundants)
const colorize = (task: Task) => redundantRules.value.has(task.id) ? 'color: orange' : undefined
</script>

<style>
.wrapped {
  word-break: break-spaces;
  white-space: break-spaces !important;
}
</style>