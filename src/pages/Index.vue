<template>
  <q-page>
    <div class="row items-start justify-center text-right q-col-gutter-md q-ma-md">
      <div class="col-grow">
        <q-btn
          icon="fas fa-sync"
          label="Refresh"
          color="primary"
          class="q-ma-sm"
          @click="refresh"
        />
        <q-btn
          icon="fas fa-plus"
          label="Create Task"
          color="positive"
          class="q-ma-sm"
          @click="openCreateTaskDialog"
        />
        <q-btn
          color="grey"
          icon="fas fa-times-circle"
          label="Clear Completed"
          class="q-ml-sm q-my-sm"
          @click="clearCompleted"
        />
      </div>
    </div>
    <!-- For full height cards: <q-page class="row items-stretch justify-evenly q-col-gutter-md q-ma-md"> -->
    <div class="row items-start justify-evenly q-col-gutter-md q-ma-md">
      <div class="col-grow">
        <task-docket
          title="Today"
          :tasks="today"
          :multi-select-enabled="multiSelectEnabled"
          @update:multi-select="toggleMultiSelect"
        ></task-docket>
      </div>
      <div class="col-grow">
        <task-docket
          title="Tomorrow"
          :tasks="tomorrow"
          :multi-select-enabled="multiSelectEnabled"
          @update:multi-select="toggleMultiSelect"
        ></task-docket>
      </div>
      <div class="col-grow">
        <task-docket
          title="Upcoming"
          :tasks="upcoming"
          :multi-select-enabled="multiSelectEnabled"
          @update:multi-select="toggleMultiSelect"
        ></task-docket>
      </div>
      <div class="col-grow">
        <task-docket
          title="Someday"
          :tasks="someday"
          :multi-select-enabled="multiSelectEnabled"
          @update:multi-select="toggleMultiSelect"
        ></task-docket>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { Task as TaskInterface } from 'components/models'
import { computed, defineComponent, ref } from 'vue'
import { useStore, StateInterface } from '../store'
import Task from '../models/task'

import TaskDocket from 'components/TaskDocket.vue';
import CurrentTaskDialog from 'components/CurrentTaskDialog.vue'
import TaskSearchDialog from 'components/TaskSearchDialog.vue'

import { errorNotification } from '../hackerman/ErrorNotification'
import { syncWithBackend } from '../hackerman/sync'

export default defineComponent({
  name: 'PageIndex',
  components: { TaskDocket },

  preFetch({ store, redirect }) {
    const isAuthenticated =
      (
        store.state.authentication.sessionToken !== null &&
        store.state.authentication.sessionToken.length > 0
      )
    if (!isAuthenticated) {
      redirect({ path: '/login' })
    }
  },

  setup() {
    const $q = useQuasar()
    const $store = useStore()

    const sessionToken = computed({
      get: () => $store.state.authentication.sessionToken,
      set: value => {
        $store.commit('authentication/setSessionToken', value)
      }
    })

    const selectedList = computed({
      get: (): string => $store.state.settings.selectedList,
      set: value => {
        $store.commit('settings/setSelectedList', value)
      }
    })

    const selectedTags = computed({
      get: (): Array<string> => $store.state.settings.selectedTags,
      set: value => {
        $store.commit('settings/setSelectedTags', value)
      }
    })

    const tagsFilter = computed({
      get: (): string => $store.state.settings.tagsFilter,
      set: value => {
        $store.commit('settings/setTagsFilter', value)
      }
    })

    const taskSearch = computed({
      get: () => $store.state.settings.taskSearch,
      set: value => {
        $store.commit('settings/setTaskSearch', value)
      }
    })

    const today = computed(
      () => $store.getters['tasks/today'](
        $store,
        selectedList.value,
        selectedTags.value,
        tagsFilter.value,
        taskSearch.value
      )
    )

    const tomorrow = computed(
      () => $store.getters['tasks/tomorrow'](
        $store,
        selectedList.value,
        selectedTags.value,
        tagsFilter.value,
        taskSearch.value
      )
    )

    const upcoming = computed(
      () => $store.getters['tasks/upcoming'](
        $store,
        selectedList.value,
        selectedTags.value,
        tagsFilter.value,
        taskSearch.value
      )
    )

    const someday = computed(
      () => $store.getters['tasks/someday'](
        $store,
        selectedList.value,
        selectedTags.value,
        tagsFilter.value,
        taskSearch.value
      )
    )

    const multiSelectEnabled = ref(false)

    function openCreateTaskDialog() {
      $q.dialog({
        component: TaskSearchDialog,

        componentProps: {
          dialogTitle: 'Create Task',
          searchLabel: 'Title',
          onCreate: (payload: any) => { createTask(payload) },
          onSelect: (payload: any) => { openTask(payload.task) }
        }
      })
    }

    function clearCompleted() {
      $store.dispatch('tasks/clearCompleted').
      then(
        (response: any) => {
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Cleared completed tasks',
            icon: 'fas fa-tasks'
          })
        },
        (error: any) => {
          errorNotification(error, 'Failed to clear completed tasks')
        }
      )
    }

    function createTask(payload: any) {
      $store.dispatch('tasks/create', payload.options).
      then(
        (response: any) => {
          payload.callback()
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Created new task',
            icon: 'fas fa-tasks'
          })
        },
        (error: any) => {
          errorNotification(error, 'Failed to create task')
        }
      )
    }

    function openTask(task: TaskInterface) {
      $q.dialog({
        component: CurrentTaskDialog,

        componentProps: {
          task: task
        }
      })
    }

    function refresh() {
      syncWithBackend($store)
    }

    function toggleMultiSelect(payload) {
      multiSelectEnabled.value = payload.value
    }

    return {
      clearCompleted,
      sessionToken,
      today,
      tomorrow,
      upcoming,
      someday,
      multiSelectEnabled,
      openCreateTaskDialog,
      refresh,
      toggleMultiSelect
    };
  }
});
</script>
