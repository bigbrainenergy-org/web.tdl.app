<template>
  <q-drawer v-model="model" side="left" elevated dark show-if-above :width="200" :breakpoint="500">
    <q-list padding>
      <q-item v-ripple clickable @click="openCreateTaskDialog">
        <q-item-section avatar>
          <q-icon name="add" />
        </q-item-section>

        <q-item-section> Add Task </q-item-section>
      </q-item>

      <q-item v-ripple clickable @click="openSearchDialog">
        <q-item-section avatar>
          <q-icon name="search" />
        </q-item-section>

        <q-item-section> Search </q-item-section>
      </q-item>

      <q-item v-ripple clickable>
        <q-item-section avatar>
          <q-icon name="inbox" />
        </q-item-section>

        <q-item-section> Inbox </q-item-section>
      </q-item>

      <q-item v-ripple clickable>
        <q-item-section avatar>
          <q-icon name="today" />
        </q-item-section>

        <q-item-section> Today </q-item-section>
      </q-item>

      <q-item v-ripple clickable>
        <q-item-section avatar>
          <q-icon name="calendar_month" />
        </q-item-section>

        <q-item-section> Upcoming </q-item-section>
      </q-item>

      <q-item
        v-ripple
        clickable
        :active="listSelected({ title: '' })"
        :style="listSelected({ title: '' }) ? listColorStyle({ color: '#ffffff' }) : null"
        @click="setList({ title: '' })"
      >
        <q-item-section avatar>
          <q-icon name="checklist" />
        </q-item-section>

        <q-item-section> All Tasks </q-item-section>
      </q-item>
    </q-list>

    <p class="q-ma-sm text-bold text-h6">Lists</p>

    <q-list padding overflow-hidden full-width>
      <q-item
        v-for="(list, index) in lists"
        :key="index"
        v-ripple
        :active="listSelected(list)"
        clickable
        full-width
        :style="listSelected(list) ? listColorStyle(list) : null"
        @click="setList(list)"
        @mouseover="hoveredList = index"
        @mouseleave="hoveredList = -1"
      >
        <q-menu context-menu>
          <q-list>
            <q-item clickable>
              <q-item-section> Edit </q-item-section>
              <q-item-section avatar>
                <q-icon name="edit" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
        <q-item-section side class="q-mr-none">
          <q-icon name="tag" :style="listIconColor(list)" />
        </q-item-section>

        <q-item-section>
          <q-item-label class="ellipsis">
            {{ list.title }}
          </q-item-label>
        </q-item-section>

        <q-item-section
          side
          :style="listSelected(list) ? listCountStyle(list) : null"
          class="q-pa-none q-ma-none"
        >
          <template v-if="hoveredList === index">
            <q-btn icon="more_horiz" flat padding="xs" size="md" @click.stop="openMenu(index)" />
          </template>
          <template v-else>
            {{ list.incompleteTaskCount }}
          </template>
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRepo } from 'pinia-orm'
  import { useQuasar } from 'quasar'
  import { List, ListRepo } from 'src/stores/lists/list'
  import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task'
  import CreateTaskDialog from 'src/components/dialogs/CreateTaskDialog.vue'
  import { Utils } from 'src/util'
  import { TDLAPP } from 'src/TDLAPP'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { storeToRefs } from 'pinia'
  import { textColor } from 'src/hackerman/TextColor'

  const $q = useQuasar()
  const model = defineModel<boolean>({ default: false })
  const listsRepo = useRepo(ListRepo)
  const localSettingsStore = useLocalSettingsStore()
  const { selectedList } = storeToRefs(localSettingsStore)

  // FIXME: I hate this with every fiber of my being
  const hoveredList = ref(-1)

  const lists = computed(() => listsRepo.withAll().get())
  console.log({ lists: lists.value })

  const openSearchDialog = () => TDLAPP.searchDialog()

  const createTask = (payload: CreateTaskOptions) => {
    const tr = useRepo(TaskRepo)
    tr.addAndCache(payload).then(() => {
      Utils.notifySuccess('Successfully created a task')
    }, Utils.handleError('Failed to create task.'))
  }

  const openCreateTaskDialog = () => {
    $q.dialog({
      component: CreateTaskDialog,
      componentProps: {
        onCreate: (payload: { options: CreateTaskOptions; callback: () => void }) => {
          const newTask = payload.options
          newTask.hard_prereq_ids = []
          newTask.hard_postreq_ids = []
          createTask(newTask)
        }
      }
    })
  }

  type HasTitle = { title: string }

  const setList = (list: HasTitle) => {
    selectedList.value = list.title
  }

  const listSelected = (list: HasTitle) => {
    return selectedList.value === list.title
  }

  // TODO: These can all be DRY'd up.
  const listCountStyle = (list: List) => {
    return `color: ${textColor(list.color)};`
  }

  const listColorStyle = (list: { color: string }) => {
    return `color: ${textColor(list.color)}; background-color: ${list.color};`
  }

  const listIconColor = (list: List) => {
    if (listSelected(list)) {
      return `color: ${textColor(list.color)};`
    } else {
      return `color: ${list.color};`
    }
  }

  const openMenu = (index: number) => {
    console.log({ index })
  }
</script>
