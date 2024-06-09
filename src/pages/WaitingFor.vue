<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-pain">Waiting For</div>
                <div>{{ tasks.length }} Items</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-list>
              <q-item
                v-for="(currentTask, index) in tasks"
                :key="currentTask.id"
                v-ripple
                clickable
                @click="openTask(currentTask)"
              >
                <q-item-section>
                  {{ currentTask.title }}
                </q-item-section>

                <q-item-section v-if="currentTask.notes" side>
                  <q-icon name="description">
                    <q-tooltip
                      anchor="center right"
                      self="center left"
                      :offset="[10, 10]"
                    >
                      Has additional notes! Click to view.
                    </q-tooltip>
                  </q-icon>
                </q-item-section>

                <q-menu
                  :ref="
                    (el) => {
                      if (el) taskMenus[index] = el
                    }
                  "
                  context-menu
                  auto-close
                >
                  <q-list style="min-width: 100px">
                    <q-item clickable @click="openTask(currentTask)">
                      <q-item-section>Open</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="fas fa-external-link-alt" />
                      </q-item-section>
                    </q-item>

                    <q-separator />

                    <q-item clickable>
                      <q-item-section>Delete</q-item-section>
                      <q-item-section avatar>
                        <q-icon color="negative" name="fas fa-trash" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-item>
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

<script lang="ts">
import { useQuasar } from 'quasar'
import { computed, defineComponent, ref } from 'vue'

import Task from '../models/task'
import { ITask as TaskInterface } from 'components/models'
import UpdateTaskDialog from 'components/UpdateTaskDialog.vue'
import { useRepo } from 'pinia-orm'

export default defineComponent({
  name: 'PageTask',

  setup() {
    const tasksRepo = useRepo(Task)
    const tasks = computed(() => tasksRepo.all())

    const $q = useQuasar()

    const taskMenus = ref<TaskInterface[]>([])

    function openTask(currentTask: TaskInterface) {
      $q.dialog({
        component: UpdateTaskDialog,

        componentProps: {
          currentTask: currentTask
        }
      })
    }

    return {
      tasks,
      taskMenus,
      openTask
    }
  }
})
</script>
