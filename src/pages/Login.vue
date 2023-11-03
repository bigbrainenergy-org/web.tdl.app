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

import { useAuthenticationStore } from 'src/stores/authentication/pinia-authentication';
import { Utils } from 'src/util'

export default defineComponent({
  name: 'PageLogin',

  setup() {
    const $q = useQuasar()
    const authenticationStore = useAuthenticationStore()
    
    const $router = useRouter()

    const username = ref('')
    const password = ref('')

    function login() {
      authenticationStore.login({
        username: username.value,
        password: password.value
      }).
      then(
        () => {
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
        Utils.handleError('Failed to log in')
      )
    }

    return { username, password, login };
  }
});
</script>
