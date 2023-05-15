<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          color='green'
          icon="fas fa-plus"
          @click="openCreateInboxItemDialog"
          v-if="currentPath == '/inbox'"
        />
        <q-btn
          color='green'
          @click="$router.go(-1)"
          label="Go Back"
          icon="fas fa-arrow-left"
          v-if="currentPath == '/settings'"
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
                  <div class="text-glitch text-h4" :data-text="usernameComputed">
                    {{ usernameComputed }}
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
        <q-route-tab icon="fas fa-inbox" to="/inbox" label="Inbox" :class="$q.screen.lt.sm ? 'q-pt-sm' : null" />
        <q-route-tab icon="fas fa-tasks" to="/next-actions" label="Next Actions" :class="$q.screen.lt.sm ? 'q-pt-sm' : null" />
        <q-route-tab icon="fas fa-user-clock" to="/waiting-for" label="Waiting For" :class="$q.screen.lt.sm ? 'q-pt-sm' : null" />
        <q-route-tab icon="fas fa-project-diagram" to="/projects" label="Projects" :class="$q.screen.lt.sm ? 'q-pt-sm' : null" />
      </q-tabs>
    </q-footer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'

import { useRoute, useRouter } from 'vue-router'
import { computed, defineComponent, ref, watch } from 'vue'
import { api } from 'boot/axios'
import { errorNotification } from '../hackerman/ErrorNotification'

import CreateInboxItemDialog from 'components/CreateInboxItemDialog.vue'
import { useAuthenticationStore } from 'src/store/authentication/pinia-authentication'
import { useUsersStore } from 'src/store/users/pinia-users'
import { useInboxItemsStore } from 'src/store/inbox-items/pinia-inbox-items'

export default defineComponent({
  name: 'MainLayout',

  setup () {
    const $q = useQuasar()
    
    const $route = useRoute()
    const $router = useRouter()

    const drawerTabs = ref('lists')
    const currentPath = ref($route.path)

    const authenticationStore = useAuthenticationStore()
    const userStore = useUsersStore()

    const sessionTokenComputed = computed({
      get: () => authenticationStore.sessionToken,
      set: value => {
        authenticationStore.setSessionToken(value)
      }
    })

    const usernameComputed = computed(
      () => userStore.username
    )

    function logout() {
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
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Logged out successfully',
            icon: 'fas fa-sign-out-alt'
          })
        },
        (error) => {
          sessionTokenComputed.value = '' // Remove token even if it fails
          void $router.push({ path: '/login' })
          errorNotification(error, 'Failed to logout properly')
        }
      )
    }

    function openCreateInboxItemDialog() {
      $q.dialog({
        component: CreateInboxItemDialog,

        componentProps: {
          onCreate: (payload: any) => { createInboxItem(payload) }
        }
      })
    }

    function createInboxItem(payload: any) {
      const inboxItemStore = useInboxItemsStore()
      inboxItemStore.create(payload.options).
      then(
        (response: any) => {
          payload.callback()
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Created inbox item',
            icon: 'fas fa-tasks'
          })
        },
        (error: any) => {
          errorNotification(error, 'Failed to create inbox item')
        }
      )
    }

    watch(
      () => $route.path,
      (newValue) => {
        currentPath.value = newValue
      }
    )

    return {
      usernameComputed,
      logout,
      openCreateInboxItemDialog,
      currentPath
    }
  }
})
</script>
