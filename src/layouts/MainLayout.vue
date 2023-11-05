<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          color='green'
          icon='fa-solid fa-plus'
          @click="openCreateTaskDialog"
          v-if="pagesWithNewTaskButton.includes(currentPath)"
        />
        <q-btn
          color='green'
          @click="$router.go(-1)"
          label="Go Back"
          icon="fa-solid fa-arrow-left"
          v-if="currentPath === '/settings'"
        />
        <q-btn
          color='green'
          @click="openCreateListDialog"
          icon="fa-solid fa-plus"
          v-if="currentPath === '/lists'"
        />

        <q-space />

        <q-btn
          dense
          flat
          no-wrap
        >
          <q-avatar rounded size="32px">
            <q-icon name="fas fa-user-circle" />
          </q-avatar>
          <q-icon name="arrow_drop_down" size="24px" />

          <q-menu auto-close>
            <q-list>
              <q-item>
                <q-item-section class="text-center">
                  <div class="text-pain">Logged in as:</div>
                  <div class="text-glitch text-h4" :data-text="ur.username">
                    {{ ur.username }}
                  </div>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable @click="$router.push({ path: '/settings' })">
                <q-item-section>Settings</q-item-section>
                <q-item-section avatar>
                  <q-icon name="settings" />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable @click="logout">
                <q-item-section>Logout</q-item-section>
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

    <q-footer elevated class="bg-grey-8 text-white">
      <q-tabs shrink :inline-label="!$q.screen.lt.sm" :dense="$q.screen.lt.sm">
        <q-route-tab icon="fa-solid fa-inbox" to="/tasks" label="Tasks" :class="$q.screen.lt.sm ? 'q-pt-sm' : null" />
        <q-route-tab icon="fa-solid fa-project-diagram" to="/lists" label="Lists" :class="$q.screen.lt.sm ? 'q-pt-sm' : null" />
        <q-route-tab icon="fa-solid fa-project-diagram" to="/tasks-tree" label="Tree" :class="$q.screen.lt.sm ? 'q-pt-sm' : null" />
        <q-route-tab icon="fa-solid fa-project-diagram" to="/reverse-tasks-tree" label="Reverse Tree" :class="$q.screen.lt.sm ? 'q-pt-sm' : null" />
      </q-tabs>
    </q-footer>

    <q-page-container>
      <router-view keep-alive></router-view>
      <!-- <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        
      </router-view> -->
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useAuthenticationStore } from 'src/stores/authentication/pinia-authentication';
import { api } from 'src/boot/axios';
import errorNotification from 'src/hackerman/ErrorNotification';
import CreateTaskDialog from 'src/components/CreateTaskDialog.vue';
import { UserRepo } from 'src/stores/users/user'
import { useRepo } from 'pinia-orm'
import { CreateTaskOptions, TaskRepo } from 'src/stores/tasks/task'
import { Utils } from 'src/util'
import { syncWithBackend } from 'src/hackerman/sync'
import { AxiosError } from 'axios'

console.debug('In Main Layout')

const $q = useQuasar()
const $route = useRoute()
const $router = useRouter()

const currentPath = computed(() => $route.path)

const pagesWithNewTaskButton = [
  '/tasks',
  '/tasks-tree',
  '/reverse-tasks-tree'
]

const authenticationStore = useAuthenticationStore()
const ur = useRepo(UserRepo)

await syncWithBackend()

const sessionTokenComputed = computed({
  get: () => authenticationStore.sessionToken,
  set: value => {
    authenticationStore.sessionToken = value
  }
})

const logout = () => {
  if(sessionTokenComputed.value === null || sessionTokenComputed.value === '') {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: 'You can checkout anytime, but you can never leave.',
      icon: 'report_problem'
    })
    return
  }
  api.delete('/logout', {
    headers: {
      Authorization: `Bearer ${sessionTokenComputed.value}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  }).
  then(
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
  tr.add(payload)
  .then(
    Utils.handleSuccess('Created task', 'fa-solid fa-tasks'),
    Utils.handleError('Failed to create task.')
  )
}

const openCreateTaskDialog = () => {
  $q.dialog({
    component: CreateTaskDialog,
    componentProps: {
      onCreate: (payload: {options: CreateTaskOptions, callback: () => void}) => { 
        const newTask = payload.options
        newTask.hard_prereq_ids = []
        newTask.hard_postreq_ids = []
        createTask(newTask) 
      }
    }
  })
}

const openCreateListDialog = () => {
  Utils.notifySuccess('Coming soon')
}

</script>
