<template>
  <!-- For full height cards: <q-card class="full-height"> -->
  <q-card class="full-height">
    <q-card-section class="bg-primary text-white">
      <div class="row">
        <div class="col">
          <div class="text-h6">{{ title }}</div>
        </div>
        <div class="col text-right" v-if="multiSelectEnabled && tasks.length !== 0">
          <q-checkbox v-model="allTasksSelected" toggle-order="ft" color="secondary" label="All tasks" />
          <q-btn flat round class="q-ml-sm" color="white" icon="more_vert" :disable="allTasksSelected === false">
            <q-menu>
              <q-list style="min-width: 100px;">
                <q-item clickable v-close-popup @click="bulkEditReviewAt">
                  <q-item-section>Edit review at</q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                  <q-item-section>Edit tags</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      <q-list>
        <q-item clickable v-ripple v-for="task in tasks" :key="task.id" @click="openTask(task)">
          <q-item-section avatar v-if="multiSelectEnabled">
            <q-checkbox v-model="selectedTasks" :val="task.id" />
          </q-item-section>

          <q-item-section>
            {{ task.title }}
            <div>
              <!-- Display the list as a chip
              <q-chip
                clickable
                icon="list"
                color="primary"
                @click.stop="true"
              >
                {{ task.list.title }}
              </q-chip>
              -->
              <q-chip
                clickable
                v-for="tag in task.tags"
                :key="tag.id"
                icon="local_offer"
                :style="'color: ' + textColor(tag.color) + '; background-color: ' + tag.color"
                @click.stop="toggleTag(tag.title)"
              >
                {{ tag.title }}
              </q-chip>
            </div>
          </q-item-section>

          <q-item-section avatar v-if="taskReminder(task)">
            <q-chip style="color: white; border: 1px solid white;" icon="fas fa-bell">
              {{ taskReminder(task) }}
            </q-chip>
          </q-item-section>

          <q-item-section avatar v-if="taskDue(task) || taskPriority(task)">
            <template v-if="taskDue(task)">
              <q-icon color="red" name="fas fa-exclamation-circle">
                <q-tooltip
                  anchor="center right"
                  self="center left"
                  :offset="[10, 10]"
                  class="bg-red text-white"
                >
                  Task overdue!
                </q-tooltip>
              </q-icon>
            </template>
            <template v-else-if="taskPriority(task)">
              <q-icon color="yellow" name="fas fa-exclamation-triangle">
                <q-tooltip
                  anchor="center right"
                  self="center left"
                  :offset="[10, 10]"
                  class="bg-yellow text-black"
                >
                  Task high priority!
                </q-tooltip>
              </q-icon>
            </template>
          </q-item-section>
        </q-item>
        <template v-if="tasks.length == 0">
          <q-item clickable v-ripple>
            <q-item-section>
              <strong>Nothing yet!</strong>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  watch,
  ref,
} from 'vue';
import { useQuasar } from 'quasar'
import { useStore } from '../store'
import { Task as TaskInterface } from './models';
import { DateTime } from 'luxon'
import CurrentTaskDialog from 'components/CurrentTaskDialog.vue'
import QDatetimeDialog from 'components/QDatetimeDialog.vue'

import { errorNotification } from '../hackerman/ErrorNotification'
import { textColor } from '../hackerman/TextColor'

export default defineComponent({
  name: 'TaskDocket',
  props: {
    title: {
      type: String,
      required: true
    },
    tasks: {
      type: Array,
      default: () => []
    },
    multiSelectEnabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const $q = useQuasar()
    const $store = useStore()

    function openTask(task: TaskInterface) {
      $q.dialog({
        component: CurrentTaskDialog,

        componentProps: {
          task: task
        }
      })
    }

    function bulkEditReviewAt() {
      $q.dialog({
        component: QDatetimeDialog,

        componentProps: {
          datetime: '',
          label: 'Bulk edit review at'
        }
      }).onOk(
        (payload: any) => {
          $store.dispatch('tasks/bulkUpdate', {
            task_ids: selectedTasks.value,
            review_at: payload.datetime
          }).
          then(
            (response) => {
              // Should we do anything? Notification?
            },
            (error) => {
              errorNotification(error, 'Failed to bulk update review at')
            }
          )
        }
      )
    }
    const selectedTasks = ref([])

    const allTasksSelected = computed({
      get: () => {
        if (props.tasks.length === 0) {
          return false
        }
        let hasAll = props.tasks.every(
          (task) => {
            // @ts-ignore
            return selectedTasks.value.includes(task.id)
          }
        )
        let hasSome = props.tasks.some(
          (task) => {
            // @ts-ignore
            return selectedTasks.value.includes(task.id)
          }
        )

        if (hasAll) {
          return true
        } else if (hasSome) {
          return null
        } else {
          return false
        }
      },
      set: (value) => {
        if (value) {
          // @ts-ignore
          selectedTasks.value = props.tasks.map((task) => { return task.id })
        } else {
          selectedTasks.value = []
        }
      }
    })

    function toggleTag(title: string) {
      $store.commit('settings/toggleSelectedTag', title);
    }

    function taskDue(task: TaskInterface) {
      const currentTime = DateTime.local().toMillis()
      const dueTime = DateTime.fromISO(task.deadline_at).toMillis()

      return dueTime <= currentTime
    }

    function taskPriority(task: TaskInterface) {
      const currentTime = DateTime.local().toMillis()
      const dueTime = DateTime.fromISO(task.prioritize_at).toMillis()

      return dueTime <= currentTime
    }

    function taskReminder(task: TaskInterface) {
      if (!task.remind_me_at) { return null }

      const reminderTime = DateTime.fromISO(task.remind_me_at).toMillis()
      const startOfToday = DateTime.local().startOf('day').toMillis();
      const endOfToday = DateTime.local().endOf('day').toMillis();
      const endOfTomorrow = DateTime.local().plus({ days: 1 }).endOf('day').toMillis();

      if (reminderTime <= startOfToday) {
        return DateTime.fromISO(task.remind_me_at).toFormat('MMM d - t')
      } else if (reminderTime <= endOfToday) {
        return `Today - ${DateTime.fromISO(task.remind_me_at).toFormat('t')}`
      } else if (reminderTime <= endOfTomorrow) {
        return `Tomorrow - ${DateTime.fromISO(task.remind_me_at).toFormat('t')}`
      } else {
        return DateTime.fromISO(task.remind_me_at).toFormat('MMM d - t')
      }
    }

    watch(
      () => props.tasks,
      (newValue) => {
        selectedTasks.value = []
      }
    )

    return {
      openTask,
      bulkEditReviewAt,
      selectedTasks,
      allTasksSelected,
      toggleTag,
      textColor,
      taskDue,
      taskPriority,
      taskReminder
    };
  },
});
</script>
