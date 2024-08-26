import { AxiosError } from 'axios'
import { useQuasar } from 'quasar'
import { useAuthenticationStore } from 'src/stores/authentication/pinia-authentication'
import { useAxiosStore } from 'src/stores/axios-store'
import { Utils } from 'src/util'
import errorNotification from 'src/utils/notification-utils'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

export function useAuthentication() {
  const authenticationStore = useAuthenticationStore()
  const $q = useQuasar()
  const $router = useRouter()

  const sessionTokenComputed = computed({
    get: () => authenticationStore.sessionToken,
    set: (value) => {
      authenticationStore.sessionToken = value
    }
  })

  function logout() {
    if (sessionTokenComputed.value === null || sessionTokenComputed.value === '') {
      $q.notify({
        color: 'negative',
        position: 'top',
        message: 'You can checkout anytime, but you can never leave.',
        icon: 'report_problem'
      })
      return
    }
    useAxiosStore()
      .axios()
      .delete('/logout', {
        headers: {
          Authorization: `Bearer ${sessionTokenComputed.value}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      })
      .then(
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

  return { logout }
}
