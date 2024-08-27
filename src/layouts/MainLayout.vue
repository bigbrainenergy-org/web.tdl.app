<template>
  <q-layout view="hHh LpR fFf" :style="backgroundStyle">
    <MainHeader v-model:drawer="drawer" v-model:tasks="tasks" />

    <MainSidebar v-model:drawer="drawer" />

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

  import { onMounted, ref } from 'vue'
  import { UserRepo } from 'src/stores/users/user'
  import { useRepo } from 'pinia-orm'
  import { Utils } from 'src/util'
  import { TaskCache } from 'src/stores/performance/task-go-fast'
  import { useTaskShortcuts } from 'src/composables/use-task-shortcuts'
  import { useBackgroundMode } from 'src/composables/use-background-mode'
  import { useLayerZeroStore } from 'src/stores/performance/layer-zero'
  import { storeToRefs } from 'pinia'

  const drawer = ref(false)
  const { backgroundStyle } = useBackgroundMode()

  useTaskShortcuts()

  const { tasks } = storeToRefs(useLayerZeroStore())

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
