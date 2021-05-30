<template>
  <q-list>
    <draggable
      v-model="lists"
      :disabled="!editMode"
      item-key="id"
      handle=".handle"
      @start="dragging = true"
      @end="dragging = false"
      @change="syncListOrdering"
    >
      <template #header>
        <q-item
          clickable
          v-ripple
          v-if="!editMode"
          :active="selectedList === 'All Tasks'"
          @click="selectedList = 'All Tasks'"
        >
          <q-item-section>
            <q-item-label>All Tasks</q-item-label>
            <q-item-label caption>{{ allTasksCount }} tasks</q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <template #item="{ element }">
        <q-item
          v-bind:clickable="!editMode"
          v-ripple="!editMode"
          :active="selectedList === element.title"
          @click="selectedList = element.title"
        >
          <q-item-section avatar v-show="editMode">
            <q-btn flat round icon="fas fa-bars" class="handle" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="ellipsis">{{ element.title }}</q-item-label>
            <q-item-label caption>{{ taskCount(element) }} tasks</q-item-label>
          </q-item-section>

          <q-item-section avatar v-if="editMode">
            <q-btn flat round color="green" icon="fas fa-pencil-alt" @click="editList(element)" />
          </q-item-section>

          <q-item-section avatar v-if="editMode">
            <q-btn flat round color="red" icon="fas fa-trash" @click="deleteList(element)" />
          </q-item-section>
        </q-item>
      </template>
    </draggable>
  </q-list>

  <q-input v-model="newList" @keyup.enter="createList" outlined class="q-ma-md" label="Create new list" v-if="editMode">
    <template v-slot:append>
      <q-icon name="fas fa-arrow-up" />
    </template>
  </q-input>

  <div class="row justify-center q-my-md">
    <template v-if="editMode">
      <q-btn icon="fas fa-check" label="Done" @click="editMode = false" />
    </template>

    <template v-else>
      <q-btn icon="fas fa-pencil-alt" label="Edit" @click="editMode = true" />
    </template>
  </div>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { computed, defineComponent, ref } from 'vue'
import { useStore } from '../store'
import draggable from 'vuedraggable'
import EditListDialog from 'components/EditListDialog.vue'
import List from '../models/list'
import Task from '../models/task'

import { List as ListInterface } from './models'

import { errorNotification } from '../hackerman/ErrorNotification'

export default defineComponent({
  name: 'ListsControl',
  components: { draggable },

  setup() {
    const $q = useQuasar()
    const $store = useStore()
    const allTasksCount = computed(
      () => $store.getters['tasks/allTasksCount']($store)
    )
    const editMode = ref(false)
    const dragging = ref(false)
    const newList = ref('')
    const selectedList = computed({
      get: () => $store.state.settings.selectedList,
      set: value => {
        $store.commit('settings/setSelectedList', value)
      }
    })

    // const lists = computed({
    //   get: () => $store.state.lists.lists,
    //   set: value => {
    //     $store.commit('lists/setLists', value)
    //   }
    // })

    const lists = computed({
      get: () => $store.$repo(List).with('tasks').orderBy('order').orderBy('title').get(),
      set: value => {
        $store.$repo(List).save(value.map((element, index, array) => {
          return { ...element, order: index }
        }))
      }
    })

    function createList() {
      $store.dispatch('lists/create', { title: newList.value }).
      then(
        (response) => {
          newList.value = '';
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Added new list',
            icon: 'list'
          })
        },
        (error) => {
          errorNotification(error, 'Failed to add list')
        }
      )
    }

    function editList(list: ListInterface) {
      /* The order that you define the callbacks does matter - it will affect
       * the order of execution. e.g. Dismiss goes before or after other
       * callbacks
       */
      $q.dialog({
        title: `Edit list: "${list.title}"`,
        ok: {
          label: 'Save',
          color: 'positive'
        },
        cancel: {
          color: 'grey'
        },
        prompt: {
          type: 'text',
          label: 'Title',
          model: list.title,
          // @ts-ignore
          placeholder: list.title
        },
        persistent: true
      }).onOk(
        (data: any) => {
          $store.dispatch('lists/update', { id: list.id, title: data }).
          then(
            (response) => {
              if (selectedList.value === list.title) {
                selectedList.value = data
              }

              $q.notify({
                color: 'positive',
                position: 'top',
                message: 'Updated list title',
                icon: 'list'
              })
            },
            (error) => {
              errorNotification(error, 'Failed to update list')
            }
          )
        }
      )
    }

    function deleteList(list: ListInterface) {
      $q.dialog({
        title: `Delete list: "${list.title}"`,
        message: 'This cannot be undone! Are you sure?',
        ok: {
          label: 'Delete',
          color: 'negative'
        },
        cancel: {
          color: 'grey'
        }
      }).onOk(() => {
        $store.dispatch('lists/delete', { id: list.id }).
        then(
          (response) => {
            if (selectedList.value === list.title) {
              selectedList.value = 'All Tasks'
            }

            $q.notify({
              color: 'positive',
              position: 'top',
              message: 'Removed list',
              icon: 'list'
            })
          },
          (error) => {
            errorNotification(error, 'Failed to remove list')
          }
        )
      })
    }

    function syncListOrdering() {
      $store.dispatch('lists/syncOrdering').
      then(
        (response) => {
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Ordering Synced',
            icon: 'list'
          })
        },
        (error) => {
          errorNotification(error, 'Failed to sync list ordering')
        }
      )
    }

    function taskCount(list: ListInterface) {
      return $store.getters['tasks/nextUp']($store, list.title).length;
    }

    return {
      allTasksCount,
      createList,
      editMode,
      editList,
      deleteList,
      newList,
      dragging,
      lists,
      syncListOrdering,
      selectedList,
      taskCount,
    }
  }
})
</script>
