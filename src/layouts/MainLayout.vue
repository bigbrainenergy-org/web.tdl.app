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
                  <div>Logged in as:</div>
                  <div class="glitch" :data-text="username">
                    {{ username }}
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
import { useStore } from '../store'
import { useRoute, useRouter } from 'vue-router'
import { computed, defineComponent, ref, watch } from 'vue'
import { api } from 'boot/axios'
import ListsControl from 'components/ListsControl.vue'
import TagsControl from 'components/TagsControl.vue'
import { errorNotification } from '../hackerman/ErrorNotification'

import { Task as TaskInterface } from 'components/models';

import CreateInboxItemDialog from 'components/CreateInboxItemDialog.vue'
import CurrentTaskDialog from 'components/CurrentTaskDialog.vue'

export default defineComponent({
  name: 'MainLayout',
  components: { ListsControl, TagsControl },

  setup () {
    const $q = useQuasar()
    const $store = useStore()
    const $route = useRoute()
    const $router = useRouter()

    const drawerTabs = ref('lists')
    const currentPath = ref($route.path)

    const sessionToken = computed({
      get: () => $store.state.authentication.sessionToken,
      set: value => {
        $store.commit('authentication/setSessionToken', value)
      }
    })

    const username = computed({
      get: () => $store.state.settings.username,
      set: value => {
        $store.commit('settings/setUsername', value)
      }
    })

    const taskSearch = computed({
      get: () => $store.state.settings.taskSearch,
      set: value => {
        $store.commit('settings/setTaskSearch', value)
      }
    })

    function logout() {
      if(sessionToken.value === null || sessionToken.value === '') {
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
          Authorization: `Bearer ${sessionToken.value}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }).
      then(
        () => {
          sessionToken.value = ''
          void $router.push({ path: '/login' })
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Logged out successfully',
            icon: 'fas fa-sign-out-alt'
          })
        },
        (error) => {
          sessionToken.value = '' // Remove token even if it fails
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
      $store.dispatch('inboxItems/create', payload.options).
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

    function openTask(task: TaskInterface) {
      $q.dialog({
        component: CurrentTaskDialog,

        componentProps: {
          task: task
        }
      })
    }

    watch(
      () => $route.path,
      (newValue) => {
        currentPath.value = newValue
      }
    )

    return {
      drawerTabs,
      username,
      taskSearch,
      logout,
      openCreateInboxItemDialog,
      currentPath
    }
  }
})
</script>

<style>
.glitch {
  /*color: #20C20E;*/
  color: white;
  position: relative;
  margin: 0 auto;
}
.glitch:before {
  content: attr(data-text);
  position: absolute;
  left: -1px;
  text-shadow: 1px 0 red;
  top: 0;
  /*color: #20C20E;*/
  color: white;
  overflow: hidden;
  clip: rect(0, 900px, 0, 0);
  animation: noise-anim 3s infinite linear alternate-reverse;
}
.glitch:after {
  content: attr(data-text);
  position: absolute;
  left: 1px;
  text-shadow: -1px 0 blue;
  top: 0;
  /*color: #20C20E;*/
  color: white;
  overflow: hidden;
  clip: rect(0, 900px, 0, 0);
  animation: noise-anim-2 2s infinite linear alternate-reverse;
}

@keyframes noise-anim {
  0% {
    clip: rect(95px, 9999px, 69px, 0);
  }
  10% {
    clip: rect(54px, 9999px, 49px, 0);
  }
  20% {
    clip: rect(55px, 9999px, 31px, 0);
  }
  30% {
    clip: rect(81px, 9999px, 7px, 0);
  }
  40% {
    clip: rect(67px, 9999px, 84px, 0);
  }
  50% {
    clip: rect(56px, 9999px, 67px, 0);
  }
  60% {
    clip: rect(70px, 9999px, 76px, 0);
  }
  70% {
    clip: rect(15px, 9999px, 31px, 0);
  }
  80% {
    clip: rect(31px, 9999px, 93px, 0);
  }
  90% {
    clip: rect(98px, 9999px, 6px, 0);
  }
  100% {
    clip: rect(68px, 9999px, 50px, 0);
  }
}
@keyframes noise-anim-2 {
  0% {
    clip: rect(23px, 9999px, 51px, 0);
  }
  10% {
    clip: rect(28px, 9999px, 93px, 0);
  }
  20% {
    clip: rect(98px, 9999px, 47px, 0);
  }
  30% {
    clip: rect(88px, 9999px, 67px, 0);
  }
  40% {
    clip: rect(81px, 9999px, 98px, 0);
  }
  50% {
    clip: rect(5px, 9999px, 53px, 0);
  }
  60% {
    clip: rect(54px, 9999px, 32px, 0);
  }
  70% {
    clip: rect(57px, 9999px, 61px, 0);
  }
  80% {
    clip: rect(65px, 9999px, 100px, 0);
  }
  90% {
    clip: rect(18px, 9999px, 70px, 0);
  }
  100% {
    clip: rect(12px, 9999px, 65px, 0);
  }
}
</style>
