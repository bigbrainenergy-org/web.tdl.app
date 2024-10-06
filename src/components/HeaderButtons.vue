<template>
  <q-btn flat round dense icon="menu" size="lg" class="q-mr-sm" @click="drawer = !drawer" />
  <q-btn
    v-if="pagesWithNewTaskButton.includes(currentRouteName)"
    color="green"
    icon="fa-solid fa-plus"
    data-cy="create_task_button"
    @click="openCreateTaskDialog()"
  />
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
  <q-btn
    class="q-ma-md"
    color="white"
    text-color="black"
    icon="fa-solid fa-explosion"
    @click="wreak"
  />
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import {
    openCreateTaskDialog,
    openCreateProcedureDialog
  } from 'src/utils/dialog-utils'
  import { pullFresh } from 'src/utils/sync-utils'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { RouteName } from 'src/router/routes'

  const $route = useRoute()
  const $router = useRouter()
  // const routedComponent = ref<ComponentPublicInstance | null>(null)
  // const routedKey = ref(0)
  const drawer = defineModel<boolean>('drawer')

  // 2024-09-17: updated to use a string literal type as a source of truth
  const pagesWithNewTaskButton: RouteName[] = ['List', 'Calendar', 'Tree', 'Graph', 'Focus']
  const currentRouteName = computed(() => $route.name as RouteName)

  const wreak = async () => {
    const tr = useTaskStore()
    const autoTaskName = 'auto task for testing purposes'
    for (let i = 1; i < 10; i++) {
      await tr.apiCreate({ title: `${autoTaskName} ${i}` })
    }
  }
</script>
