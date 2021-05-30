<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" :maximized="true">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">{{ dialogTitle }}</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <template v-if="task">
              <div class="text-h5 text-primary">{{ task.title }}</div>
              <q-separator class="q-my-md" />
            </template>

            <q-input
              v-model="search"
              filled
              clearable
              @update:model-value="searchForTasks"
              @keyup.enter="searchForTasks"
              debounce="1000"
              :label="searchLabel"
            >
              <template v-slot:append>
                <q-btn
                  round
                  flat
                  dense
                  icon="search"
                  @click="searchForTasks"
                />
              </template>
            </q-input>
            <template v-if="advancedOptions">
              <br>
              <q-select
                v-model="selectedTags"
                filled
                use-chips
                multiple
                clearable
                :options="tags"
                option-value="id"
                option-label="title"
                label="Tags"
              />
              <br>
              <q-select
                v-model="selectedList"
                filled
                :options="lists"
                option-value="id"
                option-label="title"
                label="List"
              />
              <br>
              <q-input
                v-model="notes"
                filled
                autogrow
                label="Notes"
              />
            </template>

            <br>

            <div class="row">
              <div class="col-grow">
                <q-btn
                  icon="fas fa-plus"
                  label="Create New Task"
                  color="primary"
                  @click="createTask"
                />
              </div>
              <div class="col text-right">
                <q-toggle
                  v-model="advancedOptions"
                  class="q-mr-md"
                  color="primary"
                  label="Advanced Options"
                />
              </div>
            </div>

            <template v-if="search">
              <q-separator class="q-my-md" />
              <div class="text-h4 q-mb-md">{{ resultsTitle }} - {{ results.length }}</div>
              <q-list>
                <q-item clickable v-ripple v-if="!results.length">
                  <q-item-section>No results found</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-ripple
                  v-for="task in results"
                  :key="task.id"
                  @click="selectTask(task)"
                >
                  <q-item-section>
                    {{ task.title }}
                    <div>
                      <q-chip
                        clickable
                        v-for="tag in task.tags"
                        :key="tag.id"
                        icon="local_offer"
                        @click.stop="true"
                        :style="'color: ' + textColor(tag.color) + '; background-color: ' + tag.color"
                      >
                        {{ tag.title }}
                      </q-chip>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </template>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import List from '../models/list'
import Task from '../models/task'
import Tag from '../models/tag'
import { useStore } from '../store'
import {
  defineComponent,
  PropType,
  computed,
  ref,
  toRef,
  Ref,
} from 'vue';
import Fuse from 'fuse.js'

import { textColor } from '../hackerman/TextColor'

export default {
  props: {
    dialogTitle: {
      type: String,
      required: true
    },
    searchLabel: {
      type: String,
      default: () => 'Search'
    },
    resultsTitle: {
      type: String,
      default: () => 'Possible matches'
    },
    task: {
      type: Object,
      default: () => ({})
    },
    excludeFromSearch: {
      type: Array,
      default: () => []
    }
  },

  emits: [
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits,
    'create',
    'select'
  ],

  setup (props, { emit }) {
    const $store = useStore()

    // REQUIRED; must be called inside of setup()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    // dialogRef      - Vue ref to be applied to QDialog
    // onDialogHide   - Function to be used as handler for @hide on QDialog
    // onDialogOK     - Function to call to settle dialog with "ok" outcome
    //                    example: onDialogOK() - no payload
    //                    example: onDialogOK({ /*.../* }) - with payload
    // onDialogCancel - Function to call to settle dialog with "cancel" outcome

    let excludeList = props.excludeFromSearch.map((task) => { return task.id })

    const notes = ref('')

    const search = ref('')
    const results = ref([])

    const searchOptions = {
      isCaseSensitive: false,
      ignoreLocation: true,
      keys: ['title']
    }

    const advancedOptions = ref(false)

    const lists = computed({
      get: () => $store.$repo(List).with('tasks').orderBy('order').orderBy('title').get()
    })

    const tags = computed({
      get: () => $store.$repo(Tag).orderBy('order').orderBy('title').get()
    })

    let temp_list_object = {}

    if (props.task && props.task.list) {
      temp_list_object = { id: props.task.list.id, title: props.task.list.title }
    } else {
      temp_list_object = { id: lists.value[0].id, title: lists.value[0].title }
    }

    const selectedList = ref(temp_list_object)
    const selectedTags = ref([])

    if (props.task && props.task.tags) {
      let temp = props.task.tags.map(
        (tag) => {
          let temp = { id: tag.id, title: tag.title }
          return temp
        }
      )
      selectedTags.value = temp
    }

    function searchForTasks() {
      if(!search.value) { return } // Guard clause if search is empty

      const tasks = $store.$repo(Task).
        with('list').with('prereqs').with('postreqs').with('tags').get()

      const fuse = new Fuse(tasks, searchOptions)

      // unsanitized user input being fed into a library? what could go wrong.
      // FIXME: AKA this is a vuln waiting to happen, fix it.
      const run = fuse.search(search.value)

      results.value = tasks.filter(
        (task) => {
          return !excludeList.includes(task.id)
        }
      ).filter(
        (task) => {
          return run.some(
            (searchElement) => {
              return (searchElement.item.id === task.id)
            }
          )
        }
      ).sort(
        (first, second) => {
          const firstIndex = run.findIndex(
            (element) => { return element.item.title == first.title }
          )
          const secondIndex = run.findIndex(
            (element) => { return element.item.title == second.title }
          )
          return firstIndex - secondIndex
        }
      )
    }

    function createTask() {
      emit('create', {
        options: {
          title: search.value,
          list_id: selectedList.value.id,
          tag_ids: selectedTags.value.map((tag) => { return tag.id }),
          notes: notes.value
        },
        callback: clearSearch
      })
    }

    function selectTask(task) {
      emit('select', { task: task, callback: hideTask })
    }

    function clearSearch() {
      search.value = ''
      notes.value = ''
    }

    function hideTask(task) {
      excludeList.push(task.id)
      searchForTasks() // Rerun search so it hides what you just chose
    }

    return {
      // Custom stuff
      selectedTags,
      selectedList,
      //
      search,
      results,
      searchForTasks,
      createTask,
      selectTask,
      textColor,
      advancedOptions,
      //
      notes,
      //
      tags,
      lists,

      // This is REQUIRED;
      // Need to inject these (from useDialogPluginComponent() call)
      // into the vue scope for the vue html template
      dialogRef,
      onDialogHide,

      // other methods that we used in our vue html template;
      // these are part of our example (so not required)
      onOKClick () {
        // on OK, it is REQUIRED to
        // call onDialogOK (with optional payload)
        onDialogOK()
        // or with payload: onDialogOK({ ... })
        // ...and it will also hide the dialog automatically
      },

      // we can passthrough onDialogCancel directly
      onCancelClick: onDialogCancel
    }
  }
}
</script>

