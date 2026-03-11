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
              <q-item-section v-if="degrees.size > 0" side>
                <DegreeStars
                  :model-value="degrees.get(item.id) ?? null"
                  @update:model-value="(val) => emit('updateDegree', { taskId: item.id, degree: val })"
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
                <q-icon
                  v-if="item.notes?.includes('!PROJECT')"
                  name="fa-solid fa-folder-open"
                  color="primary"
                />
                <q-item-label lines="2">
                  {{ item.title }}
                </q-item-label>
              </q-item-section>
            </template>
            <q-list>
              <MenuListItem v-for="(menuitem, index) in menuItems" :key="index" :item="item" :menu-item="menuitem" />
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
  import type { Task } from 'src/stores/tasks/task-model'
  import type { SimpleMenuItem } from 'src/utils/types'
  import { computed, onMounted } from 'vue'
  import { onUpdated } from 'vue'
  import { ref } from 'vue'
  import MenuListItem from './MenuListItem.vue'
  import DegreeStars from './glorious/DegreeStars.vue'

  export interface EntityType {
    singular: string
    plural: string
  }

  interface Props {
    items?: Array<Task>
    dependencyType?: EntityType // eg. Prerequisites (capitalize)
    menuItems?: Array<SimpleMenuItem<Task>>
    showPrune?: boolean
    degrees?: Map<number, 1 | 2 | 3 | null>
  }

  const prop = withDefaults(defineProps<Props>(), {
    items: () => [],
    dependencyType: () => ({ plural: 'Requisites', singular: 'Requisite' }),
    menuItems: () => [],
    showPrune: false,
    degrees: () => new Map()
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
    'pruneDependencies',
    'updateDegree'
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
