<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-pain">Inbox</div>
                <div>{{ tasks.length }} Items</div>
              </div>
              <div class="col text-right">
                <q-btn color="positive" @click="openReviewDialog" :disabled="tasks.length === 0">Begin Review</q-btn>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-list>
              <q-item
                clickable
                v-ripple
                v-for="(current_task, index) in tasks"
                :key="index"
                @click="openTask(current_task)"
              >
                <q-item-section>
                  {{ current_task.title }}
                </q-item-section>

                <q-item-section side v-if="current_task.notes">
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

                <q-menu context-menu auto-close :ref="getRef">
                  <q-list style="min-width: 100px">
                    <q-item clickable @click="openTask(current_task)">
                      <q-item-section>Open</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="fas fa-external-link-alt" />
                      </q-item-section>
                    </q-item>

                    <q-separator />

                    <q-item clickable @click="openReviewDialog">
                      <q-item-section>Begin Review</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="fas fa-clipboard-list" />
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

<script lang="ts">
import { useQuasar } from 'quasar'
import { computed, defineComponent, ref } from 'vue'


import { Task } from 'src/stores/tasks/task'
import UpdateTaskDialog from 'components/UpdateTaskDialog.vue'
import ReviewDialog from 'components/ReviewDialog.vue'
import { useRepo } from 'pinia-orm'

export default defineComponent({
  name: 'PageInbox',

  setup() {
    const $q = useQuasar()
    const taskRepo = useRepo(Task)

    const tasks = computed(
      () => taskRepo.all()
    )

    const taskMenus = ref<Task[]>([])

    const getRef = (index: number) => {
      return (el: any) => {
        if (el) {
          taskMenus.value[index] = el
        }
      }
    }

    function openTask(current_task: Task) {
      $q.dialog({
        component: UpdateTaskDialog,

        componentProps: {
          current_task: current_task
        }
      })
    }

    function openReviewDialog() {
      $q.dialog({
        component: ReviewDialog
      })
    }

    return {
      tasks,
      taskMenus,
      getRef,
      openTask,
      openReviewDialog
    }
  }
});
</script>
