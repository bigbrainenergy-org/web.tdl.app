<template>
  <div>
    <q-btn flat round dense icon="menu" size="lg" class="q-mr-sm" @click="drawer = !drawer" />
    <q-btn
      v-if="currentRouteName === 'Settings'"
      color="green"
      label="Go Back"
      icon="fa-solid fa-arrow-left"
      @click="$router.go(-1)"
    />
    <q-btn
      v-if="currentRouteName === 'Routines'"
      color="green"
      icon="fa-solid fa-plus"
      @click="openCreateProcedureDialog('header button')"
    />
    <q-btn class="q-ma-md" color="yellow" icon="fa-solid fa-refresh" @click="pullFresh" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import {
    openCreateTaskDialog,
    //openQuickSortDialog,
    openCreateProcedureDialog,
    considerOpeningQuickSortDialog
  } from 'src/utils/dialog-utils'
  import { pullFresh } from 'src/utils/sync-utils'
  // import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  // import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  //import { Task } from 'src/stores/tasks/task-model'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { RouteName } from 'src/router/routes'

  const $route = useRoute()
  const $router = useRouter()
  // const routedComponent = ref<ComponentPublicInstance | null>(null)
  // const routedKey = ref(0)
  const drawer = defineModel<boolean>('drawer')
  //const tasks = defineModel<Array<Task>>('tasks', { required: true })

  // HACK: There's probably a better way to handle this that's not hard-coded paths in an array
  // 2024-09-17: updated to use a string literal type as a source of truth
  const pagesWithNewTaskButton: RouteName[] = ['List', 'Calendar', 'Tree', 'Graph', 'Focus']
  const currentRouteName = computed(() => $route.name as RouteName)

</script>
