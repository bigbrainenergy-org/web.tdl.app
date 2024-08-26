<template>
  <q-layout view="hHh LpR fFf" :style="backgroundStyle">
    <main-header v-model:drawer="drawer" />

    <main-sidebar v-model:drawer="drawer" />

    <main-footer />

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
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useQuasar, Dialog } from 'quasar'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthenticationStore } from 'src/stores/authentication/pinia-authentication'
  import errorNotification from 'src/utils/notification-utils'
  import CreateTaskDialog from 'src/components/dialogs/CreateTaskDialog.vue'
  import TaskSearchDialog from 'src/components/dialogs/TaskSearchDialog.vue'
  import MainHeader from 'src/components/MainHeader.vue'
  import MainSidebar from 'src/components/MainSidebar.vue'
  import MainFooter from 'src/components/MainFooter.vue'
  import { UserRepo } from 'src/stores/users/user'
  import { useRepo } from 'pinia-orm'
  import { CreateTaskOptions, Task, TaskRepo } from 'src/stores/tasks/task'
  import { Utils } from 'src/util'
  import { syncWithBackend } from 'src/utils/sync-utils'
  import { AxiosError } from 'axios'
  import { useAxiosStore } from 'src/stores/axios-store'
  import { ComponentPublicInstance } from 'vue'
  import { BackgroundMode, useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import QuickSortLayerZeroDialog from 'src/components/dialogs/QuickSortLayerZeroDialog.vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import { TaskCache } from 'src/stores/performance/task-go-fast'
  import { cachedTask, useAllTasksStore } from 'src/stores/performance/all-tasks'
  import { useLayerZeroStore } from 'src/stores/performance/layer-zero'
  import { storeToRefs } from 'pinia'
  import { useTaskShortcuts } from 'src/composables/use-task-shortcuts'
  import { useBackgroundMode } from 'src/composables/use-background-mode'

  const $q = useQuasar()
  const $route = useRoute()
  const $router = useRouter()
  const routedComponent = ref<ComponentPublicInstance | null>(null)
  const drawer = ref(false)
  const { backgroundStyle } = useBackgroundMode()

  useTaskShortcuts()

  // REVIEW: Sus
  onMounted(() => {
    const user = useRepo(UserRepo).getUser()
    if (user === null || typeof user === 'undefined') {
      console.warn('user data issue.')
      return
    }
    Utils.updateLuxonTimeZone(user.time_zone)
    TaskCache.regenerate()
  })
</script>
