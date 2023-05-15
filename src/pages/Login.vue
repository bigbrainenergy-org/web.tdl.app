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

import { useRouter } from 'vue-router'
import { defineComponent, ref } from 'vue'

import { errorNotification } from '../hackerman/ErrorNotification'
import { syncWithBackend } from '../hackerman/sync'
import { useUsersStore } from 'src/store/users/pinia-users'
import { useAuthenticationStore } from 'src/store/authentication/pinia-authentication'

export default defineComponent({
  name: 'PageLogin',

  setup() {
    const $q = useQuasar()
    const authenticationStore = useAuthenticationStore()
    const userStore = useUsersStore()
    
    const $router = useRouter()

    const username = ref('')
    const password = ref('')

    function login() {
      authenticationStore.login({
        username: username.value,
        password: password.value
      }).
      then(
        (response: any) => {
          username.value = ''
          password.value = ''
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Logged in successfully',
            icon: 'fas fa-sign-out-alt'
          })
          $router.push({ path: '/' })
        },
        (error: any) => {
          errorNotification(error, 'Failed to login')
        }
      )
    }

    return { username, password, login };
  }
});
</script>
