<template>
  <q-layout view="hHh LpR fFf" :style="backgroundStyle">
    <MainHeader v-model:drawer="sideBarOpen" v-model:tasks="tasks" />

    <MainSidebar v-model:drawer="sideBarOpen" />

    <MainFooter />

    <q-page-container>
      <router-view v-slot="{ Component, route }">
        <keep-alive>
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
  import MainHeader from 'src/components/MainHeader.vue'
  import MainSidebar from 'src/components/MainSidebar.vue'
  import MainFooter from 'src/components/MainFooter.vue'
  import { useTaskShortcuts } from 'src/composables/use-task-shortcuts'
  import { useBackgroundMode } from 'src/composables/use-background-mode'
  import { useTasks } from 'src/composables/use-tasks'
  import { ref } from 'vue'
  import { considerOpeningQuickSortDialog } from 'src/utils/dialog-utils'
  import { storeToRefs } from 'pinia'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'

  const { sideBarOpen } = storeToRefs(useLocalSettingsStore())
  const { backgroundStyle } = useBackgroundMode()

  useTaskShortcuts()

  const { tasks } = useTasks()

  considerOpeningQuickSortDialog()
</script>
