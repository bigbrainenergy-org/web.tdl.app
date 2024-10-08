<template>
  <q-drawer v-model="drawer" side="left" elevated dark show-if-above :width="200" :breakpoint="500">
    <q-list padding>
      <q-item v-ripple clickable @click="openCreateTaskDialog">
        <q-item-section avatar>
          <q-icon name="add" />
        </q-item-section>

        <q-item-section>Add Task</q-item-section>
      </q-item>

      <q-item v-ripple clickable @click="openSearchDialog">
        <q-item-section avatar>
          <q-icon name="search" />
        </q-item-section>

        <q-item-section>Search</q-item-section>
      </q-item>

      <q-item v-ripple clickable>
        <q-item-section avatar>
          <q-icon name="inbox" />
        </q-item-section>

        <q-item-section>Inbox</q-item-section>
      </q-item>

      <q-item v-ripple clickable>
        <q-item-section avatar>
          <q-icon name="today" />
        </q-item-section>

        <q-item-section>Today</q-item-section>
      </q-item>

      <q-item v-ripple clickable>
        <q-item-section avatar>
          <q-icon name="calendar_month" />
        </q-item-section>

        <q-item-section>Upcoming</q-item-section>
      </q-item>

      <q-item
        v-ripple
        clickable
        :active="agendaSelected"
        :style="agendaSelected ? listColorStyle({ color: '#ffffff' }) : null"
        @click="setAgenda"
      >
        <q-item-section avatar>
          <q-icon name="fa-solid fa-inbox" />
        </q-item-section>

        <q-item-section>Agenda</q-item-section>
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

        <q-item-section>All Tasks</q-item-section>
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
  import { List, ListRepo } from 'src/stores/lists/list'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { storeToRefs } from 'pinia'
  import { autoContrastTextColor } from 'src/utils/color-utils'
  import { openCreateTaskDialog, openSearchDialog } from 'src/utils/dialog-utils'

  const drawer = defineModel<boolean>('drawer')
  const listsRepo = useRepo(ListRepo)
  const localSettingsStore = useLocalSettingsStore()
  const {
    currentBaseQueryMode,
    currentFilteringMode,
    currentSortingMode,
    selectedList
  } = storeToRefs(localSettingsStore)

  // HACK: I hate this with every fiber of my being
  const hoveredList = ref(-1)

  const lists = computed(() => listsRepo.withAll().get())

  type HasTitle = { title: string }

  const setList = (list: HasTitle) => {
    currentBaseQueryMode.value = 'allTasks'
    currentFilteringMode.value = 'filterByList'
    currentSortingMode.value = 'sortByPostreqs'
    selectedList.value = list.title
  }

  const setAgenda = () => {
    currentBaseQueryMode.value = 'layerZero'
    currentFilteringMode.value = 'filterByAgenda'
    currentSortingMode.value = 'sortByAgenda'
  }

  const agendaSelected = computed(() => currentFilteringMode.value === 'filterByAgenda')

  const listSelected = (list: HasTitle) => {
    return currentFilteringMode.value === 'filterByList' && selectedList.value === list.title
  }

  // TODO: These can all be DRY'd up.
  const listCountStyle = (list: List) => {
    return `color: ${autoContrastTextColor(list.color)};`
  }

  const listColorStyle = (list: { color: string }) => {
    return `color: ${autoContrastTextColor(list.color)}; background-color: ${list.color};`
  }

  const listIconColor = (list: List) => {
    if (listSelected(list)) {
      return `color: ${autoContrastTextColor(list.color)};`
    } else {
      return `color: ${list.color};`
    }
  }

  const openMenu = (index: number) => {
    console.debug({ index })
  }
</script>
