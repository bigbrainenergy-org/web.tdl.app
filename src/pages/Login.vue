<template>
  <centered-page>
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
        <LoginForm v-model:server="server" v-model:username="username" v-model:password="password" @login="login" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat data-cy="login" @click="login">{{ $t('login') }}</q-btn>
      </q-card-actions>
    </q-card>
  </centered-page>
</template>

<script setup lang="ts">
  import { useQuasar, useMeta } from 'quasar'
  import { useRouter } from 'vue-router'
  import { ref } from 'vue'
  import { useAuthenticationStore } from 'src/stores/authentication/pinia-authentication'
  import { useAxiosStore } from 'src/stores/axios-store'
  import { syncWithBackend } from 'src/utils/sync-utils'
  import LoginForm from 'src/components/forms/LoginForm.vue'
  import CenteredPage from 'src/components/CenteredPage.vue'
  import { handleError } from 'src/utils/notification-utils'

  useMeta(() => ({ title: 'Login | TDL App' }))

  const authenticationStore = useAuthenticationStore()
  const $q = useQuasar()
  const $router = useRouter()

  const username = ref('')
  const password = ref('')
  const server = ref(useAxiosStore().URL())

  const login = () => {
    useAxiosStore().axios(server.value)
    authenticationStore
      .login({
        username: username.value,
        password: password.value
      })
      .then(() => {
        username.value = ''
        password.value = ''
        $q.notify({
          color: 'positive',
          position: 'top',
          message: 'Logged in successfully',
          icon: 'fas fa-sign-out-alt'
        })
        syncWithBackend().then(
          () => $router.push({ path: '/' }),
          handleError('Failed to fetch data')
        )
      }, handleError('Failed to log in'))
  }
</script>
