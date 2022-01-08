<template>
  <q-page class="row items-center justify-evenly">
    <q-card>
      <q-card-section class="bg-grey-8 text-white">
        <q-item>
          <q-item-section avatar>
            <q-icon name="fas fa-terminal" />
          </q-item-section>
          <q-item-section>
            <div class="text-h5">TDL App</div>
          </q-item-section>
        </q-item>
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" autofocus>
          <q-input
            v-model="username"
            filled
            :label="$t('username')"
          >
            <template v-slot:prepend>
              <q-icon name="account_circle" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            filled
            :label="$t('password')"
            type="password"
            @keyup.enter="login"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat @click="login">{{ $t('login') }}</q-btn>
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { useStore } from '../store'
import { useRouter } from 'vue-router'
import { defineComponent, ref } from 'vue'

import { errorNotification } from '../hackerman/ErrorNotification'
import { syncWithBackend } from '../hackerman/sync'

export default defineComponent({
  name: 'PageLogin',

  preFetch({ store, redirect }) {
    if (store.getters['authentication/loggedIn'] === true) {
      redirect({ path: '/' })
    }
  },

  setup() {
    const $q = useQuasar()
    const $store = useStore()
    const $router = useRouter()

    const username = ref('')
    const password = ref('')

    function login() {
      $store.dispatch('authentication/login', {
        username: username.value,
        password: password.value,
      }).
      then(
        (response) => {
          username.value = ''
          password.value = ''
          syncWithBackend($store)
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Logged in successfully',
            icon: 'fas fa-sign-out-alt'
          })
          void $router.push({ path: '/' })
        },
        (error) => {
          errorNotification(error, 'Failed to login')
        }
      )
    }

    return { username, password, login };
  }
});
</script>
