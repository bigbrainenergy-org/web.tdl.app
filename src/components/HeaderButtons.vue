<template>
  <q-btn flat round dense icon="menu" size="lg" class="q-mr-sm" @click="drawer = !drawer" />
  <q-btn
    v-if="pagesWithNewTaskButton.includes(currentPath)"
    color="green"
    icon="fa-solid fa-plus"
    data-cy="create_task_button"
    @click="openCreateTaskDialog()"
  />
  <q-btn
    v-if="currentPath === '/settings'"
    color="green"
    label="Go Back"
    icon="fa-solid fa-arrow-left"
    @click="$router.go(-1)"
  />
  <q-btn
    v-if="currentPath === '/lists'"
    color="green"
    icon="fa-solid fa-plus"
    @click="openCreateListDialog"
  />
  <q-btn class="q-ma-md" color="yellow" icon="fa-solid fa-refresh" @click="pullFresh" />
  <q-btn class="q-ma-md" color="red" icon="fa-solid fa-refresh" @click="dumpDebug" />
  <q-btn
    class="q-ma-md"
    color="white"
    text-color="black"
    icon="fa-solid fa-explosion"
    @click="wreak"
  />
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useQuasar, Dialog } from 'quasar'
  import { useRoute, useRouter } from 'vue-router'
  import { openCreateTaskDialog } from 'src/utils/dialog-utils'
  import { pullFresh } from 'src/utils/sync-utils'

  const $q = useQuasar()
  const $route = useRoute()
  const $router = useRouter()
  const routedComponent = ref<ComponentPublicInstance | null>(null)
  const routedKey = ref(0)
  const drawer = defineModel<boolean>('drawer')

  const pagesWithNewTaskButton = [
    '/focus',
    '/tasks',
    '/josh-page',
    '/tasks-tree',
    '/reverse-tasks-tree',
    '/graph',
    '/agenda'
  ]
  const currentPath = computed(() => $route.path)

  const dumpDebug = () => {
    const lss = useLoadingStateStore()
    const payload = {
      busy: lss.busy,
      quickSortOpen: lss.quickSortDialogActive,
      addTaskOpen: lss.createTaskDialogActive,
      addDependencyOpen: lss.addDependencyDialogActive,
      layerZeroLength: tasks.value.length,
      tasksWithoutPosts: tasks.value.filter(
        (x) => x.hard_postreqs.filter((y) => !y.completed).length > 0
      ).length,
      shouldSort: shouldSort.value
    }
    console.debug(payload)
  }

  const wreak = async () => {
    const tr = useRepo(TaskRepo)
    const autoTaskName = 'auto task for testing purposes'
    for (let i = 1; i < 10; i++) {
      await tr.addAndCache({ title: `${autoTaskName} ${i}` })
    }
  }
</script>
