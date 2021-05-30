<template>
  <div class="row q-ma-sm justify-center">
    <q-btn-toggle
      v-model="tagsFilter"
      toggle-color="primary"
      :options="[
        { label: 'All', value: 'all' },
        { label: 'Any', value: 'any' },
        { label: 'None', value: 'none' }
      ]"
    />
  </div>
  <div class="row q-mt-sm q-mx-sm q-mb-md justify-center">
    <q-btn @click="clearTags()">
      Clear Tags
    </q-btn>
  </div>
  <q-list>
    <draggable
      v-model="tags"
      :disabled="!editMode"
      item-key="id"
      handle=".handle"
      @start="dragging = true"
      @end="dragging = false"
      @change="syncTagOrdering"
    >
      <template #header>
        <q-item
          clickable
          v-ripple
          v-if="!editMode"
          :active="tagSelected('No Tags')"
          @click="toggleTag('No Tags')"
          :style="tagSelected('No Tags') && !editMode ? 'color: black; background-color: white;' : null"
        >
          <q-item-section>
            <q-item-label>No Tags</q-item-label>
            <q-item-label
              caption
              :style="tagSelected('No Tags') && !editMode ? 'color: black;' : null"
            >
              {{ taskCount({ title: 'No Tags' }) }} tasks
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <template #item="{ element }">
        <q-item
          v-bind:clickable="!editMode"
          v-ripple="!editMode"
          :active="tagSelected(element.title) && !editMode"
          @click="toggleTag(element.title)"
          :style="tagSelected(element.title) && !editMode ? 'color: ' + textColor(element.color) + '; background-color: ' + element.color + ';' : null"
        >
          <q-item-section avatar v-show="editMode">
            <q-btn flat round icon="fas fa-bars" class="handle" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="ellipsis">{{ element.title }}</q-item-label>
            <q-item-label
              caption
              :style="tagSelected(element.title) && !editMode ? 'color: ' + textColor(element.color) + ';' : null"
            >
              {{ taskCount(element) }} tasks
            </q-item-label>
          </q-item-section>

          <q-item-section avatar v-if="editMode">
            <q-btn flat round color="green" icon="fas fa-pencil-alt" @click="editTag(element)" />
          </q-item-section>

          <q-item-section avatar v-if="editMode">
            <q-btn flat round color="red" icon="fas fa-trash" @click="deleteTag(element)" />
          </q-item-section>
        </q-item>
      </template>
    </draggable>
  </q-list>

  <q-input v-model="newTag" @keyup.enter="createTag" outlined class="q-ma-md" label="Create new tag" v-if="editMode">
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
import EditTagDialog from 'components/EditTagDialog.vue'
import { Tag as TagInterface } from './models'
import Tag from '../models/tag'
import Task from '../models/task'

import { errorNotification } from '../hackerman/ErrorNotification'
import { textColor } from '../hackerman/TextColor'

export default defineComponent({
  name: 'TagsControl',
  components: { draggable },

  setup() {
    const $q = useQuasar()
    const $store = useStore()
    const editMode = ref(false)
    const dragging = ref(false)
    const newTag = ref('')
    const selectedList = computed({
      get: () => $store.state.settings.selectedList,
      set: value => {
        $store.commit('settings/setSelectedList', value)
      }
    })
    const selectedTags = computed({
      get: () => $store.state.settings.selectedTags,
      set: value => {
        $store.commit('settings/setSelectedTags', value)
      }
    })
    const tagsFilter = computed({
      get: () => $store.state.settings.tagsFilter,
      set: value => {
        $store.commit('settings/setTagsFilter', value)
      }
    })

    const tags = computed({
      get: () => $store.$repo(Tag).orderBy('order').orderBy('title').get(),
      set: value => {
        $store.$repo(Tag).save(value.map((element, index, array) => {
          return { ...element, order: index }
        }))
      }
    })

    function tagSelected(title: string) {
      return selectedTags.value.some(
        (tag) => {
          return tag === title
        }
      )
    }

    function toggleTag(title: string) {
      $store.commit('settings/toggleSelectedTag', title);
    }

    function createTag() {
      $store.dispatch('tags/create', { title: newTag.value }).
      then(
        (response) => {
          newTag.value = '';
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Added new tag',
            icon: 'tag'
          })
        },
        (error) => {
          errorNotification(error, 'Failed to add tag')
        }
      )
    }

    function editTag(tag: TagInterface) {
      /* The order that you define the callbacks does matter - it will affect
       * the order of execution. e.g. Dismiss goes before or after other
       * callbacks
       */
      $q.dialog({
        title: `Edit tag: "${tag.title}"`,
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
          model: tag.title,
          // @ts-ignore
          placeholder: tag.title
        },
        persistent: true
      }).onOk(
        (data: string) => {
          $store.dispatch('tags/update', { id: tag.id, title: data }).
          then(
            (response) => {
              if (tagSelected(tag.title)) {
                toggleTag(tag.title)
                toggleTag(data)
              }

              $q.notify({
                color: 'positive',
                position: 'top',
                message: 'Updated tag title',
                icon: 'tag'
              })
            },
            (error) => {
              errorNotification(error, 'Failed to update tag')
            }
          )
        }
      )
    }

    function deleteTag(tag: TagInterface) {
      $q.dialog({
        title: `Delete tag: "${tag.title}"`,
        message: 'This cannot be undone! Are you sure?',
        ok: {
          label: 'Delete',
          color: 'negative'
        },
        cancel: {
          color: 'grey'
        }
      }).onOk(() => {
        $store.dispatch('tags/delete', { id: tag.id }).
        then(
          (response) => {
            if (tagSelected(tag.title)) {
              toggleTag(tag.title)
            }

            $q.notify({
              color: 'positive',
              position: 'top',
              message: 'Removed tag',
              icon: 'tag'
            })
          },
          (error) => {
            errorNotification(error, 'Failed to remove tag')
          }
        )
      })
    }

    function syncTagOrdering() {
      $store.dispatch('tags/syncOrdering').
      then(
        (response) => {
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Ordering Synced',
            icon: 'tag'
          })
        },
        (error) => {
          errorNotification(error, 'Failed to sync tag ordering')
        }
      )
    }

    function taskCount(tag: TagInterface) {
      return $store.getters['tasks/nextUp']($store, selectedList.value, [tag.title], 'all').length;
    }

    function clearTags() {
      $store.commit('settings/clearTags')
    }

    return {
      tagsFilter,
      clearTags,
      createTag,
      editMode,
      editTag,
      deleteTag,
      newTag,
      dragging,
      tags,
      syncTagOrdering,
      selectedTags,
      taskCount,
      tagSelected,
      toggleTag,
      textColor,
    }
  }
})
</script>
