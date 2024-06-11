<template>
  <q-layout view="hHh LpR fFf" :style="formattedBackgroundMode">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="menu" size="lg" class="q-mr-sm" @click="drawer = !drawer" />
        <q-btn
          v-if="pagesWithNewTaskButton.includes(currentPath)"
          color="green"
          icon="fa-solid fa-plus"
          @click="openCreateTaskDialog"
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

        <q-space />

        <q-btn dense flat no-wrap>
          <q-avatar rounded size="32px">
            <q-icon name="fas fa-user-circle" />
          </q-avatar>
          <q-icon name="arrow_drop_down" size="24px" />

          <q-menu auto-close>
            <q-list>
              <q-item>
                <q-item-section class="text-center">
                  <div class="text-pain">Logged in as:</div>
                  <div class="text-glitch text-h4" :data-text="username">
                    {{ username }}
                  </div>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable @click="$router.push({ path: '/settings' })">
                <q-item-section>{{ $t('settings') }}</q-item-section>
                <q-item-section avatar>
                  <q-icon name="settings" />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable @click="logout">
                <q-item-section>Logout/Change Server</q-item-section>
                <q-item-section avatar>
                  <q-icon name="fas fa-sign-out-alt" />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable @click="pullFresh">
                <q-item-section>Pull Latest From Server</q-item-section>
                <q-item-section avatar>
                  <q-icon name="fas fa-sign-out-alt" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>

          <q-menu context-menu auto-close>
            <q-list>
              <q-item clickable>
                <q-item-section>Testing</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <task-sidebar v-model="drawer" />

    <q-footer elevated class="bg-grey-8 text-white">
      <q-tabs shrink :inline-label="!$q.screen.lt.sm" :dense="$q.screen.lt.sm">
        <q-route-tab
          icon="fa-solid fa-circle-dot"
          to="/focus"
          label="Focus"
          :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
        />
        <q-route-tab
          icon="fa-solid fa-inbox"
          to="/tasks"
          label="Tasks"
          :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
        />
        <q-route-tab
          icon="fa-solid fa-inbox"
          to="/josh-page"
          label="Josh"
          :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
        />
        <q-route-tab
          icon="fa-solid fa-inbox"
          to="/agenda"
          label="Agenda"
          :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
        />
        <q-route-tab
          icon="fa-solid fa-project-diagram"
          to="/lists"
          label="Lists"
          :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
        />
        <q-route-tab
          icon="fa-solid fa-project-diagram"
          to="/tasks-tree"
          label="Tree"
          :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
        />
        <q-route-tab
          icon="fa-solid fa-project-diagram"
          to="/graph"
          label="Graph"
          :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
        />
      </q-tabs>
    </q-footer>

    <q-page-container>
      <router-view ref="routedComponent" :key="routedKey" keep-alive></router-view>
      <!-- <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>

      </router-view> -->
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useQuasar, Dialog } from 'quasar'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthenticationStore } from 'src/stores/authentication/pinia-authentication'
  import errorNotification from 'src/hackerman/ErrorNotification'
  import CreateTaskDialog from 'src/components/dialog/CreateTaskDialog.vue'
  import TaskSearchDialog from 'src/components/dialog/TaskSearchDialog.vue'
  import TaskSidebar from 'src/components/TaskSidebar.vue'
  import { UserRepo } from 'src/stores/users/user'
  import { useRepo } from 'pinia-orm'
  import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task'
  import { Utils, computedWithPrev } from 'src/util'
  import { syncWithBackend } from 'src/hackerman/sync'
  import { AxiosError } from 'axios'
  import { useAxiosStore } from 'src/stores/axios-store'
  import { ComponentPublicInstance } from 'vue'
  import { BackgroundMode, useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import { useAllTasksStore } from 'src/stores/performance/all-tasks'
  import QuickSortLayerZeroDialog from 'src/components/dialog/QuickSortLayerZeroDialog.vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { useLayerZeroStore } from 'src/stores/performance/layer-zero'

  const $q = useQuasar()
  const $route = useRoute()
  const $router = useRouter()
  const routedComponent = ref<ComponentPublicInstance | null>(null)
  const routedKey = ref(0)
  const drawer = ref(false)

  const refreshRoutedComponent = () => {
    console.warn('refreshing routed component')
    routedKey.value++
  }

  const currentPath = computed(() => $route.path)

  const handleKeyUp = (event: KeyboardEvent) => {
    const activeElement = document.activeElement
    if (activeElement === null) {
      console.warn('keyboard event thrown but active element not found')
      return
    }
    const isTextInputFocused =
      activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA'
    if (event.key === 'Q' || event.key === 'q') {
      if (!isTextInputFocused && !isDialogOpen.value) {
        openCreateTaskDialog()
      }
    } else if (event.key === '/' || event.key === 'Slash') {
      console.log('yup')
      if (!isTextInputFocused && !isDialogOpen.value) {
        event.preventDefault()
        openSearchDialog()
      }
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === '/' || event.key === 'Slash') {
      event.preventDefault()
    }
  }

  onMounted(() => {
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('keydown', handleKeyDown)
  })

  const pagesWithNewTaskButton = [
    '/focus',
    '/tasks',
    '/josh-page',
    '/tasks-tree',
    '/reverse-tasks-tree',
    '/graph',
    '/agenda'
  ]

  const authenticationStore = useAuthenticationStore()
  const ur = useRepo(UserRepo)

  const username = computed(() => {
    return (ur.getUser() ?? { username: 'guest' }).username
  })

  const sessionTokenComputed = computed({
    get: () => authenticationStore.sessionToken,
    set: (value) => {
      authenticationStore.sessionToken = value
    }
  })

  const logout = () => {
    if (sessionTokenComputed.value === null || sessionTokenComputed.value === '') {
      $q.notify({
        color: 'negative',
        position: 'top',
        message: 'You can checkout anytime, but you can never leave.',
        icon: 'report_problem'
      })
      return
    }
    useAxiosStore()
      .axios()
      .delete('/logout', {
        headers: {
          Authorization: `Bearer ${sessionTokenComputed.value}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      })
      .then(
        () => {
          sessionTokenComputed.value = ''
          void $router.push({ path: '/login' })
          Utils.notifySuccess('Logged out successfully', 'fa-solid fa-sign-out-alt')
        },
        (error: AxiosError | Error) => {
          sessionTokenComputed.value = '' // Remove token even if it fails
          void $router.push({ path: '/login' })
          errorNotification(error, 'Failed to logout properly')
        }
      )
  }

  const createTask = (payload: CreateTaskOptions) => {
    const tr = useRepo(TaskRepo)
    tr.addAndCache(payload).then(() => {
      Utils.notifySuccess('Successfully created a task')
      refreshRoutedComponent()
    }, Utils.handleError('Failed to create task.'))
  }

  // HACK: This is super fragile and dumb atm
  const isDialogOpen = ref(false)

  const openCreateTaskDialog = () => {
    isDialogOpen.value = true
    $q.dialog({
      component: CreateTaskDialog,
      componentProps: {
        onCreate: (payload: { options: CreateTaskOptions; callback: () => void }) => {
          const newTask = payload.options
          newTask.hard_prereq_ids = []
          newTask.hard_postreq_ids = []
          createTask(newTask)
          isDialogOpen.value = false
        }
      }
    }).onDismiss(() => {
      isDialogOpen.value = false
    })
  }

  // FIXME: DRY
  const openSearchDialog = () => {
    isDialogOpen.value = true
    $q.dialog({
      component: TaskSearchDialog,
      componentProps: {
        dialogTitle: 'Search For A Task',
        taskID: undefined,
        showCreateButton: true,
        closeOnSelect: true,
        initialFilter: [],
        batchFilter: []
      }
    }).onDismiss(() => {
      isDialogOpen.value = false
    })
  }

  const openCreateListDialog = () => {
    Utils.notifySuccess('Coming soon')
  }

  const pullFresh = async () => {
    const syncResult = await syncWithBackend()
    if (syncResult === 1)
      errorNotification(new Error('Failed to refresh local storage'), 'Error Refreshing All')
    else {
      Utils.notifySuccess('Refreshed All')
      refreshRoutedComponent()
    }
  }

  const dumpDebug = () => {
    const lss = useLoadingStateStore()
    const payload = {
      busy: lss.busy,
      quickSortOpen: lss.quickSortDialogActive,
      addTaskOpen: lss.createTaskDialogActive,
      addDependencyOpen: lss.addDependencyDialogActive,
      layerZeroLength: layerZero.value.length,
      tasksWithoutPosts: layerZero.value.filter((x) => x.grabPostreqs(true).length === 0).length,
      shouldSort: shouldSort.value
    }
    console.debug(payload)
  }

  onMounted(() => {
    const user = useRepo(UserRepo).getUser()
    if (user === null || typeof user === 'undefined') {
      console.warn('user data issue.')
      return
    }
    Utils.updateLuxonTimeZone(user.time_zone)
    useAllTasksStore().regenerate()
    useLayerZeroStore().regenerate()
  })

  const backgroundModeSetting = computed<BackgroundMode>(
    () => useLocalSettingsStore().backgroundMode
  )
  const initialMode = backgroundModeSetting.value
  const currentBackgroundMode = ref<string>(initialMode === 'image' ? '#000000' : initialMode)
  const formattedBackgroundMode = computed(() =>
    backgroundModeSetting.value !== 'image'
      ? `background-color: ${currentBackgroundMode.value} !important`
      : undefined
  )

  function hexToRgb(hex: string) {
    let r = parseInt(hex.slice(1, 3), 16)
    let g = parseInt(hex.slice(3, 5), 16)
    let b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  // Helper function to convert RGB to hex
  function rgbToHex(r: number, g: number, b: number) {
    console.debug({ r, g, b })
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16)
          return hex.length === 1 ? '0' + hex : hex
        })
        .join('')
    )
  }

  // Helper function to increment or decrement a value by one step towards a target
  function stepTowards(current: number, target: number) {
    if (current < target) {
      return current + 1
    } else if (current > target) {
      return current - 1
    } else {
      return current
    }
  }

  const incrementHexColor = (currentValue: string, targetValue: string) => {
    let currentRGB = hexToRgb(currentValue)
    let targetRGB = hexToRgb(targetValue)
    currentRGB.r = stepTowards(currentRGB.r, targetRGB.r)
    currentRGB.g = stepTowards(currentRGB.g, targetRGB.g)
    currentRGB.b = stepTowards(currentRGB.b, targetRGB.b)
    return rgbToHex(currentRGB.r, currentRGB.g, currentRGB.b)
  }

  watch(backgroundModeSetting, () => {
    console.log('background mode setting was changed.')
    let animationHack = setInterval(() => {
      if (backgroundModeSetting.value === 'image') clearInterval(animationHack)
      if (backgroundModeSetting.value === currentBackgroundMode.value) clearInterval(animationHack)
      else
        currentBackgroundMode.value = incrementHexColor(
          currentBackgroundMode.value,
          backgroundModeSetting.value
        )
    }, 10)
  })

  const layerZero = computed(() => {
    // no longer need to worry about busy signal because we are using cache that is updated by child components.
    return useLayerZeroStore().get()
  })

  // todo: storeToRefs
  const hasTooManyInLayerZero = () =>
    useLocalSettingsStore().enableQuickSortOnLayerZeroQTY > 0
      ? layerZero.value.length > useLocalSettingsStore().enableQuickSortOnLayerZeroQTY
      : false
  const hasNewTasksInLayerZero = () =>
    useLocalSettingsStore().enableQuickSortOnNewTask
      ? layerZero.value.filter((x) => x.grabPostreqs(true).length === 0).length > 0
      : false
  const quickSortEnabled = () =>
    !useLocalSettingsStore().disableQuickSort &&
    $route.path !== '/settings' &&
    !useLoadingStateStore().dialogOpenExclQuickSort
  const shouldSort = computed<{ l0len: number; shouldSort: boolean }>({
    get: () => ({
      l0len: layerZero.value.length,
      shouldSort: quickSortEnabled() && (hasTooManyInLayerZero() || hasNewTasksInLayerZero())
    }),
    set: (x) => {
      if (!x.shouldSort && !(hasTooManyInLayerZero() || hasNewTasksInLayerZero())) return x
    }
  })

  const unbusy = () => {
    console.log('unbusy.')
    if (shouldSort.value.shouldSort === false) {
      useLoadingStateStore().busy = false
    }
    console.log('setting quick sort active to FALSE')
    useLoadingStateStore().quickSortDialogActive = false
  }

  const openQuickSortDialog = () => {
    if (useLoadingStateStore().quickSortDialogActive) return
    // todo fixme this is BAD.
    useLoadingStateStore().quickSortDialogActive = true
    console.log('OPENING QUICK SORT')
    Dialog.create({
      component: QuickSortLayerZeroDialog,
      componentProps: {
        objective: useLocalSettingsStore().enableQuickSortOnLayerZeroQTY
      }
    })
  }
  watch(shouldSort, () => {
    console.log(`layer zero length is ${layerZero.value.length}`)
    if (shouldSort.value.shouldSort) {
      openQuickSortDialog()
    }
  })
</script>
