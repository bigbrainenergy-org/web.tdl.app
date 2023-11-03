<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-pain">Tasks</div>
                <div>{{ tasks.length }} Items</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-list class="text-primary">
              <q-intersection
                v-for="currentTask, index in tasks"
                :key="index"
                once
                style="min-height: 48px;"
              >
                <q-item
                  clickable
                  v-ripple
                  @click="openTask(currentTask)"
                >
                  <q-item-section>
                    {{ currentTask.title }}
                  </q-item-section>

                  <q-item-section side v-if="currentTask.notes">
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

                  
                </q-item>
              </q-intersection>
              <template v-if="tasks.length === 0">
                <q-item clickable v-ripple>
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
import { useQuasar } from 'quasar'
import { computed, defineComponent } from 'vue'

import UpdateTaskDialog from 'components/UpdateTaskDialog.vue'
import { useRepo } from 'pinia-orm';
import { Task, TaskRepo } from 'src/stores/tasks/task'

const pageTasks = defineComponent({
  name: 'PageTasks',
})

const $q = useQuasar()
const tasksRepo = useRepo(TaskRepo)

const tasks = computed( () => tasksRepo.withAll().get() )

// todo: restore this feature
//const taskMenus = ref([])
/*
This was the template info that took in taskMenus (it is unclear where taskMenus is getting its data, and Typescript is scared)
<q-menu context-menu auto-close :ref="el => { if(el) taskMenus[index] = el }">
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
This was between a "More Notes" tooltip and a template v-if="tasks.length === 0"
*/

const openTask = (currentTask: Task) => {
  console.debug(`opening UpdateTaskDialog with task of ${currentTask.title}`)
  $q.dialog({
    component: UpdateTaskDialog,

    componentProps: {
      task: currentTask
    }
  })
}
</script>
