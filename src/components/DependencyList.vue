<template>
  <div data-cy="dependency_list">
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
      <!-- <TaskList
        ref="el"
        class="q-my-md"
        style="width: 100%"
        :tasks="items"
        :emptyListMessage="`No ${dependencyType?.plural}`"
      /> -->
      <q-list ref="el" class="q-my-md" style="width: 100%">
        <q-item v-if="!items.length" v-ripple>
          <q-item-section>No {{ dependencyType.plural }}</q-item-section>
        </q-item>
        <q-item v-for="(item, itemkey) in items" :key="itemkey" v-ripple>
          <q-btn-dropdown
            style="width: 100%; overflow: hidden"
            split
            auto-close
            dropdown-icon="more_vert"
            @click.stop="emit('selectItem', item)"
          >
            <template #label>
              <q-item-section avatar style="width: 9%; max-width: 9%">
                <q-checkbox
                  v-model:model-value="item.completed"
                  @update:model-value="emit('toggleCompletedItem', item)"
                />
              </q-item-section>
              <q-item-section class="vertical-top wrapped" :style="style">
                <q-icon
                  v-if="isNearRedundant(item.id)"
                  name="fas fa-triangle-exclamation"
                  color="green"
                />
                <q-icon
                  v-if="isFarRedundant(item.id)"
                  name="fas fa-triangle-exclamation"
                  color="red"
                />
                <q-item-label lines="2">
                  {{ item.title }}
                </q-item-label>
              </q-item-section>
            </template>
            <q-list>
              <q-item
                v-for="(menuitem, index) in menuItems"
                :key="index"
                v-close-popup
                clickable
                @click.stop="menuitem.action(item)"
              >
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
  import { useElementSize } from '@vueuse/core'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { Task } from 'src/stores/tasks/task-model'
  import { SimpleMenuItem } from 'src/types'
  import { computed, onMounted } from 'vue'
  import { onUpdated } from 'vue'
  import { ref } from 'vue'

  export interface EntityType {
    singular: string
    plural: string
  }

  interface Props {
    items?: Array<Task>
    dependencyType?: EntityType // eg. Prerequisites (capitalize)
    menuItems?: Array<SimpleMenuItem<Task>>
    showPrune?: boolean
  }

  const prop = withDefaults(defineProps<Props>(), {
    items: () => [],
    dependencyType: () => ({ plural: 'Requisites', singular: 'Requisite' }),
    menuItems: () => [],
    showPrune: false
  })

  // can do something like this to limit recalculations, especially when setting a task as MVP
  // const act = (action: (inputArgument: Task) => void | Promise<void | Task>, inputArgument: Task) => {
  //   action(inputArgument)
  //   updateRedundants()
  // }

  const addItemLabel = `Add ${prop.dependencyType.plural}`

  const emit = defineEmits([
    'addItem',
    'removeItem',
    'selectItem',
    'toggleCompletedItem',
    'pruneDependencies'
  ])

  const busySignal = computed(() => useLoadingStateStore().busy)

  const updateRedundants = () => {
    if (busySignal.value) return
    const start = performance.now()
    aboves.value.clear()
    belows.value.clear()
    if (prop.items.length === 0) return
    // console.warn(`updating redundant check for ${prop.items.length} dependents`)
    const arr = prop.items.map((x) => x.id)
    prop.items.forEach((x) => {
      const arrExcludingX = arr.filter(
        (y) => y !== x.id && !belows.value.has(y) && !aboves.value.has(y)
      )
      const aboveX = x.anyIDsAbove(arrExcludingX)
      const belowX = x.anyIDsBelow(arrExcludingX)
      aboveX.forEach((val, key) => {
        if (val) aboves.value.add(key)
      })
      belowX.forEach((val, key) => {
        if (val) belows.value.add(key)
      })
      // console.debug({ x, arrExcludingX, aboveX, belowX })
    })
    const duration = performance.now() - start
    if (duration > 50) console.warn(`updateRedundants took ${Math.floor(duration)}ms`)
  }

  const aboves = ref<Set<number>>(new Set())
  const belows = ref<Set<number>>(new Set())
  onMounted(updateRedundants)
  onUpdated(updateRedundants)

  const isNearRedundant = (x: number) => {
    return prop.dependencyType.singular === 'Prerequisite'
      ? belows.value.has(x)
      : aboves.value.has(x)
  }
  const isFarRedundant = (x: number) => {
    return prop.dependencyType.singular === 'Prerequisite'
      ? aboves.value.has(x)
      : belows.value.has(x)
  }

  const pruneDependencies = () => {
    emit('pruneDependencies', { above: aboves.value, below: belows.value })
  }

  const el = ref()
  // const setEl = (x: any) => (el.value = x)
  const { width } = useElementSize(el)

  const style = computed(() => {
    const multiple = 0.75
    // console.log(`${width.value} x ${multiple} = ${width.value * multiple}`)
    return {
      width: `${(width.value - 32) * multiple}px`,
      'max-width': `${(width.value - 32) * multiple}px`
    }
  })
</script>

<style>
  .wrapped {
    word-break: break-spaces;
    white-space: break-spaces !important;
    text-overflow: ellipsis;
  }
</style>
