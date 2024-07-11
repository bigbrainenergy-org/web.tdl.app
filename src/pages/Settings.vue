<template>
  <q-page class="row items-center justify-evenly">
    <q-card>
      <q-card-section class="bg-grey-8 text-white">
        <q-item>
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <div class="text-h5" data-cy="settings_title">{{ $t('settings') }}</div>
          </q-item-section>
        </q-item>
      </q-card-section>

      <q-card-section class="text-center q-pa-md">
        <div>
          <TimeZoneSwitcher />
          <LanguageSwitcher />
          <BackgroundSwitcher />
          <NotificationTimeSetting />
        </div>
        <q-btn class="q-ma-md" icon="fas fa-bell" color="indigo" label="Test Notification" />

        <q-btn
          class="q-ma-md"
          icon="settings"
          color="indigo"
          label="Focus Mode Settings"
          @click="openFocusModeSettingsDialog"
        />

        <q-separator class="q-my-md" />

        <PasswordChangeForm />

        <q-separator class="q-my-md" />

        <p>
          This app is open source! Check out the code on
          <!-- FIXME: The linter formatting is screwing this up heavily -->
          <a
            href="https://github.com/bigbrainenergy-org/web.tdl.app"
            target="_blank"
            data-cy="source_code_link"
            >Github</a
          >.
        </p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
  import { defineComponent } from 'vue'
  import { useQuasar } from 'quasar'
  import { useRouter } from 'vue-router'
  import { useAuthenticationStore } from 'src/stores/authentication/pinia-authentication'
  import FocusModeSettingsDialog from 'src/components/dialogs/FocusModeSettingsDialog.vue'
  import TimeZoneSwitcher from 'src/components/inputs/TimeZoneSwitcher.vue'
  import LanguageSwitcher from 'src/components/inputs/LanguageSwitcher.vue'
  import BackgroundSwitcher from 'src/components/inputs/BackgroundSwitcher.vue'
  import PasswordChangeForm from 'src/components/forms/PasswordChangeForm.vue'
  import NotificationTimeSetting from 'src/components/NotificationTimeSetting.vue'

  defineComponent({ name: 'SettingsPage' })

  const r = useRouter()

  const authenticationStore = useAuthenticationStore()
  if (authenticationStore.isLoggedIn !== true) {
    r.push('/login')
  }

  const $q = useQuasar()

  const openFocusModeSettingsDialog = () => {
    $q.dialog({
      component: FocusModeSettingsDialog
    })
  }
</script>
