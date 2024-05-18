<template>
  <q-drawer v-model="model" side="left" elevated dark show-if-above :width="200" :breakpoint="500">
    <q-scroll-area class="fit">
      <q-list padding>
        <q-item v-ripple clickable @click="openCreateTaskDialog">
          <q-item-section avatar>
            <q-icon name="add" />
          </q-item-section>

          <q-item-section>
            Add Task
          </q-item-section>
        </q-item>

        <q-item v-ripple clickable @click="openSearchDialog">
          <q-item-section avatar>
            <q-icon name="search" />
          </q-item-section>

          <q-item-section>
            Search
          </q-item-section>
        </q-item>

        <q-item v-ripple clickable>
          <q-item-section avatar>
            <q-icon name="inbox" />
          </q-item-section>

          <q-item-section>
            Inbox
          </q-item-section>
        </q-item>

        <q-item v-ripple clickable>
          <q-item-section avatar>
            <q-icon name="today" />
          </q-item-section>

          <q-item-section>
            Today
          </q-item-section>
        </q-item>

        <q-item v-ripple clickable>
          <q-item-section avatar>
            <q-icon name="calendar_month" />
          </q-item-section>

          <q-item-section>
            Upcoming
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :active="listSelected({title: ''})"
          :style="listSelected({title: ''}) ? listColorStyle({color: '#ffffff'}) : null"
          @click="setList({title: ''})"
        >
          <q-item-section avatar>
            <q-icon name="checklist" />
          </q-item-section>

          <q-item-section>
            All Tasks
          </q-item-section>
        </q-item>
      </q-list>

      <p class="q-ma-sm text-bold text-h6">Lists</p>

      <q-list padding>
        <q-item
          v-for="list, key in lists"
          :key="key"
          v-ripple
          :active="listSelected(list)"
          clickable
          :style="listSelected(list) ? listColorStyle(list) : null"
          @click="setList(list)"
        >
          <q-item-section avatar>
            <q-icon name="tag" :style="listIconColor(list)" />
          </q-item-section>

          <q-item-section>
            {{ list.title }}
          </q-item-section>

          <q-item-section side :style="listSelected(list) ? listCountStyle(list) : null">
            {{ list.incompleteTaskCount }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRepo } from 'pinia-orm'
import { useQuasar } from 'quasar';
import { ListRepo } from 'src/stores/lists/list'
import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task'
import CreateTaskDialog from 'src/components/dialog/CreateTaskDialog.vue'
import { Utils } from 'src/util'
import { TDLAPP } from 'src/TDLAPP'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { storeToRefs } from 'pinia'
import { textColor } from 'src/hackerman/TextColor'

const $q = useQuasar()
const model = defineModel(false)
const listsRepo = useRepo(ListRepo)
const localSettingsStore = useLocalSettingsStore()
const { selectedList } = storeToRefs(localSettingsStore)

await listsRepo.fetch()

const lists = computed(
  () => listsRepo.withAll().get()
)

const openSearchDialog = () => TDLAPP.searchDialog()

const createTask = (payload: CreateTaskOptions) => {
  const tr = useRepo(TaskRepo)
  tr.add(payload)
    .then(
      () => {
        Utils.notifySuccess('Successfully created a task')
      },
      Utils.handleError('Failed to create task.')
    )
}

const openCreateTaskDialog = () => {
  $q.dialog({
    component: CreateTaskDialog,
    componentProps: {
      onCreate: (payload: { options: CreateTaskOptions, callback: () => void }) => {
        const newTask = payload.options
        newTask.hard_prereq_ids = []
        newTask.hard_postreq_ids = []
        createTask(newTask)
      }
    }
  })
}

const setList = (list) => {
  selectedList.value = list.title
}

const listSelected = (list) => {
  return selectedList.value === list.title
}

const listCountStyle = (list) => {
  return 'color: ' + textColor(list.color) + ';'
}

const listColorStyle = (list) => {
  return 'color: ' + textColor(list.color) + '; background-color: ' + list.color + ';'
}

const listIconColor = (list) => {
  if(listSelected(list)) {
    return 'white'
  } else {
    return `color: ${list.color};`
  }
}
</script>
