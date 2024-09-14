<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-actions>
            <SettingsButton v-model:settings="tasksPageSettings" name="Tasks Page Settings" />
            <q-space />
            <q-item-label class="text-primary">{{ tasks.length }} tasks</q-item-label>
            <q-space />
            <q-btn
              icon="fa-solid fa-signs-post"
              class="text-primary"
              @click="openQuickSortDialog"
            />
            <q-btn icon="fa-solid fa-search" class="text-primary" @click="openSearchDialog" />
          </q-card-actions>
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-pain">Tasks</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-list class="text-primary">
              <q-intersection
                v-for="(currentTask, index) in tasks"
                :key="index"
                once
                style="min-height: 48px"
              >
                <q-item v-ripple clickable @click="open(currentTask.id)">
                  <q-checkbox
                    v-model:model-value="currentTask.completed"
                    color="primary"
                    keep-color
                    @update:model-value="() => currentTask.updateTaskCompletionStatus()"
                  />

                  <q-item-section>
                    <q-item-label lines="2">
                      {{ currentTask.title }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section v-if="currentTask.notes" side>
                    <q-avatar icon="description">
                      <q-tooltip anchor="center right" self="center left" :offset="[10, 10]">
                        Has additional notes! Click to view.
                      </q-tooltip>
                    </q-avatar>
                  </q-item-section>

                  <q-item-section v-if="currentTask.grabPostreqs(hideCompleted).length" side>
                    <q-chip
                      v-if="currentTask.grabPostreqs(hideCompleted).length"
                      :style="
                        currentTask.grabPostreqs(hideCompleted).length > sortQty
                          ? 'background-color: red;'
                          : 'background-color: gray;'
                      "
                    >
                      {{ currentTask.grabPostreqs(hideCompleted).length }}
                    </q-chip>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      v-if="!currentTask.completed"
                      outline
                      rounded
                      label="ADD PRE"
                      @click.stop="addTaskPre(currentTask)"
                    />
                  </q-item-section>
                </q-item>
              </q-intersection>
              <template v-if="tasks.length === 0">
                <q-item v-ripple clickable>
                  <q-item-section v-if="useLoadingStateStore().busy">
                    <strong>Loading...</strong>
                  </q-item-section>
                  <q-item-section v-else>
                    <strong>Nothing yet!</strong>
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
  import { useMeta, useQuasar } from 'quasar'
  import { computed, ref } from 'vue'

  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { TDLAPP } from 'src/TDLAPP'
  import SettingsButton from 'src/components/SettingsButton.vue'
  import QuickSortLayerZeroDialog from 'src/components/dialogs/QuickSortLayerZeroDialog.vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { storeToRefs } from 'pinia'
  import { NumericKeysObject } from 'src/types'
  import { T2 } from 'src/stores/t2/t2-model'
  import { useT2Store } from 'src/stores/t2/t2-store'

  const $q = useQuasar()

  const open = (id: number) =>
    TDLAPP.openTask(id)
      .onDismiss(() => TDLAPP.considerOpeningQuickSort('agenda'))
      .onCancel(() => TDLAPP.considerOpeningQuickSort('agenda'))
      .onOk(TDLAPP.considerOpeningQuickSort)

  const localSettingsStore = useLocalSettingsStore()

  const {
    layerZeroOnly,
    hideCompleted,
    disableQuickSort,
    enableQuickSortOnLayerZeroQTY,
    autoScalePriority
  } = storeToRefs(localSettingsStore)

  const tasksPageSettings = ref({
    'Unblocked Only': layerZeroOnly,
    'Incomplete Only': hideCompleted,
    'Auto Scale Priority': autoScalePriority
  })

  // fancy footwork
  const tasks = computed(() => {
    console.debug('recalculating agenda.')
    const layerZero = (useT2Store().array as T2[]).filter(
      (x: T2) => !x.completed && x.hard_prereqs.filter((y) => !y.completed).length === 0
    )
    layerZero.sort((a: T2, b: T2) => b.incomplete_postreqs.length - a.incomplete_postreqs.length)
    console.debug({ layerZero })
    const finalList = new Set<T2>()
    const queue: NumericKeysObject<T2[]> = {}
    const addedToQueue = new Set<number>()
    const safeAccess = (q: NumericKeysObject<T2[]>, key: number): T2[] => {
      if (typeof q[key] === 'undefined') q[key] = []
      return q[key]
    }
    const enqueue = (tasks: T2[]) => {
      tasks.forEach((x) => {
        safeAccess(queue, x.incomplete_postreqs.length).push(x)
        addedToQueue.add(x.id)
      })
    }
    enqueue(layerZero)
    {
      let qkeys = Object.keys(queue).map(Number)
      let hundos = 0
      const hasKeys = () => {
        qkeys = Object.keys(queue)
          .map(Number)
          .sort((a, b) => b - a)
        hundos++
        return qkeys.length > 0
      }
      while (hasKeys()) {
        if (hundos > 1000 * addedToQueue.size) {
          console.warn('agenda calc is taking too long. bailing out. Also TODO')
          break
        }
        let bail = false
        for (let i = 0; i < qkeys.length; i++) {
          const k = qkeys[i]
          const qk = queue[k]
          for (let j = 0; j < qk.length; j++) {
            const t = qk[j]
            const ip = t.incomplete_prereqs
            if (ip.filter((y) => !finalList.has(y)).length === 0) {
              finalList.add(t)
              enqueue(t.incomplete_postreqs.filter((x) => !addedToQueue.has(x.id)))
              qk.splice(j, 1)
              if (qk.length === 0) {
                delete queue[k]
                qkeys.splice(i, 1)
              }
              bail = true
              break
            }
          }
          if (bail) break
        }
      }
    }
    return Array.from(finalList)
  })

  const autoThreshold = computed(() => {
    const sampleSize = Math.min(tasks.value.length, 11)
    const samplePriorities = []
    for (let i = 0; i < sampleSize; i++) {
      samplePriorities.push(tasks.value[i].incomplete_postreqs.length)
    }
    samplePriorities.sort((a, b) => a - b)
    const sampleIndex = Math.max(Math.floor(sampleSize / 2), 1)
    return samplePriorities[sampleIndex]
  })

  const sortQty = computed(() => {
    const len0 = useT2Store().layerZero.length
    if (disableQuickSort.value) return len0
    return autoScalePriority.value
      ? autoThreshold.value
      : Math.max(1, enableQuickSortOnLayerZeroQTY.value - len0)
  })

  const addTaskPre = (currentTask: T2) => TDLAPP.addPrerequisitesDialog(currentTask)
  const openSearchDialog = () => TDLAPP.searchDialog()

  const openQuickSortDialog = () => $q.dialog({ component: QuickSortLayerZeroDialog })
  useMeta(() => ({ title: 'Agenda | TDL App' }))
</script>
