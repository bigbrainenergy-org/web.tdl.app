<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-actions>
            <SettingsButton v-model:settings="tasksPageSettings" />
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
                <q-item v-ripple clickable @click="open(currentTask)">
                  <q-checkbox
                    v-model:model-value="currentTask.completed"
                    color="primary"
                    keep-color
                    @update:model-value="updateTaskCompletedStatus(currentTask)"
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
                        currentTask.grabPostreqs(hideCompleted).length > 5
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
                  <q-item-section>
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
  import { useQuasar, useMeta } from 'quasar'
  import { computed, defineComponent, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useRepo } from 'pinia-orm'
  import { Task, TaskRepo } from 'src/stores/tasks/task'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { Utils } from 'src/util'
  import { TDLAPP } from 'src/TDLAPP'
  import QuickSortLayerZeroDialog from 'src/components/dialog/QuickSortLayerZeroDialog.vue'
  import { useLayerZeroStore } from 'src/stores/performance/layer-zero'
  import SettingsButton from 'src/components/SettingsButton.vue'

  useMeta(() => {
    return {
      title: 'Tasks | TDL App'
    }
  })

  const $q = useQuasar()

  const open = (task: Task) => TDLAPP.openTask(task)

  const pageTasks = defineComponent({
    name: 'PageTasks'
  })
  const tasksRepo = useRepo(TaskRepo)
  const localSettingsStore = useLocalSettingsStore()
  const { layerZeroOnly, hideCompleted, selectedList } = storeToRefs(localSettingsStore)

  const tasksPageSettings = ref({
    'Unblocked Only': layerZeroOnly,
    'Incomplete Only': hideCompleted
  })

  const notCompleted = (x: Task) => x.completed === false
  const filterByList = (x: Task) => x.list?.title === selectedList.value

  const tasks = computed(() => {
    console.warn('updating tasks on Task page')
    let baseQuery = useLayerZeroStore().layerZero as Task[]
    if (selectedList.value) baseQuery = baseQuery.filter(filterByList)
    const results = baseQuery.sort(
      (a, b) =>
        b.grabPostreqs(hideCompleted.value).length - a.grabPostreqs(hideCompleted.value).length
    )
    console.debug({ page: 'Tasks', results })
    return results
  })

  const updateTaskCompletedStatus = async (task: Task) => {
    const newStatus = task.completed
    await tasksRepo.updateAndCache({ id: task.id, payload: { task } }).then((t) => {
      if (t.completed !== newStatus)
        throw new Error('updated value and value meant to update do not match')
      TDLAPP.notifyUpdatedCompletionStatus(task)
    }, Utils.handleError('Error updating completion status of a task.'))
  }

  const addTaskPre = (currentTask: Task) => TDLAPP.addPrerequisitesDialog(currentTask)
  const openSearchDialog = () => TDLAPP.searchDialog()

  const openQuickSortDialog = () =>
    $q.dialog({
      component: QuickSortLayerZeroDialog
    })
</script>
