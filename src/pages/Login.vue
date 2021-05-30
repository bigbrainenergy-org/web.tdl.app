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
// import { Login } from 'components/models';
import { computed, defineComponent, ref } from 'vue'
import { api } from 'boot/axios'
import { errorNotification } from '../hackerman/ErrorNotification'
import { syncWithBackend } from '../hackerman/sync'

export default defineComponent({
  name: 'PageLogin',

  preFetch({ store, redirect }) {
    const isAuthenticated =
      (
        store.state.authentication.sessionToken !== null &&
        store.state.authentication.sessionToken.length > 0
      )
    if (isAuthenticated) {
      redirect({ path: '/' })
    }
  },

  setup() {
    const $q = useQuasar()
    const $store = useStore()
    const $router = useRouter()

    const username = ref('')
    const password = ref('')

    const sessionToken = computed({
      get: () => $store.state.authentication.sessionToken,
      set: value => {
        $store.commit('authentication/setSessionToken', value)
      }
    })

    function login() {
      api.post('/login', {
        username: username.value,
        password: password.value,
        dataType: 'json',
        contentType: 'application/json'
      }).
      then(
        (response) => {
          sessionToken.value = response.data.session_token
          username.value = ''
          password.value = ''
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Logged in successfully',
            icon: 'fas fa-sign-out-alt'
          })
          syncWithBackend($store)
          void $router.push({ path: '/' })
        },
        (error) => {
          errorNotification(error, 'Failed to login')
        }
      )
    }

    return { sessionToken, username, password, login };
  }
});
</script>
