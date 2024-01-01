<template>
  <q-page class="row items-center justify-evenly">
    <q-card :class="$q.screen.lt.md ? 'fit': 'fit q-ma-md'" style="max-width: 1250px !important" :flat="$q.screen.lt.md" :square="$q.screen.lt.md">
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
        <q-form class="q-gutter-md" @submit="onSubmit" autofocus>
          <q-stepper
            v-model="step"
            vertical
            color="primary"
            animated
            flat
            header-nav
          >
            <q-step
              :name="1"
              title="Who are you?"
              icon="fas fa-question"
              :done="step > 1"
              :header-nav="step > 1"
            >
              <q-input
                v-model="name"
                filled
                :label="$t('name')"
                class="q-my-md"
                lazy-rules
                :rules="[
                  (val) => present(val) || 'Please enter your name'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="fas fa-user" />
                </template>
              </q-input>

              <q-input
                v-model="email"
                filled
                name="email"
                :label="$t('email')"
                type="email"
                :rules="[
                  val => present(val) || 'Please enter your email',
                  val => validEmail(val) || 'Invalid email format'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
              </q-input>

              <q-stepper-navigation>
                <q-btn :disable="!stepOneComplete()" @click="step = 2" color="primary" label="Continue" />
              </q-stepper-navigation>
            </q-step>

            <q-step
              :name="2"
              :title="$t('reasonForInterest')"
              icon="fas fa-question"
              :done="step > 2"
              :header-nav="step > 2"
            >
              <q-input
                v-model="reasonForInterest"
                filled
                :label="$t('reasonForInterest')"
                type="textarea"
                :rules="[
                  val => present(val) || 'Please enter why you are interested in TDL App'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="help" />
                </template>
              </q-input>

              <q-stepper-navigation>
                <q-btn :disable="!stepTwoComplete()" @click="step = 3" color="primary" label="Continue" />
                <q-btn flat @click="step = 1" color="primary" label="Back" class="q-ml-sm" />
              </q-stepper-navigation>
            </q-step>

            <q-step
              :name="3"
              title="When do you want in?"
              icon="far fa-clock"
              :done="step > 3"
              :header-nav="step > 3"
            >
              <q-list>
                <!--
                  Rendering a <label> tag (notice tag="label")
                  so QRadios will respond to clicks on QItems to
                  change Toggle state.
                -->

                <q-item tag="label" v-ripple>
                  <q-item-section avatar>
                    <q-radio v-model="versionInterest" val="alpha" color="red" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Alpha</q-item-label>
                    <q-item-label caption>
                      Razor sharp edges and sudden drops present, watch your step.
                      Not all features will be implemented yet, and things may break
                      horribly.
                      <br><br>
                      Only power users should consider this option.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item tag="label" v-ripple>
                  <q-item-section avatar>
                    <q-radio v-model="versionInterest" val="beta" color="blue" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Beta</q-item-label>
                    <q-item-label caption>
                      All of the intended features will be implemented, but may
                      still be rough around the edges. Should be daily driver ready,
                      and we will be mostly looking for bugs and UI/UX improvements.
                      <br><br>
                      May not be polished, but anyone may consider this option.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item tag="label" v-ripple>
                  <q-item-section avatar top>
                    <q-radio v-model="versionInterest" val="release" color="green" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Release</q-item-label>
                    <q-item-label caption>
                      For those seeking a truly polished TDL solution, and don't
                      have the time to deal with potential hiccups.
                      <br><br>
                      Anyone may consider this option.
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-stepper-navigation>
                <q-btn :disable="!stepThreeComplete()" @click="step = 4" color="primary" label="Continue" />
                <q-btn flat @click="step = 2" color="primary" label="Back" class="q-ml-sm" />
              </q-stepper-navigation>
            </q-step>

            <q-step
              :name="4"
              title="Are you a robot?"
              icon="fas fa-robot"
              :done="step > 4"
              :header-nav="step > 4"
            >
              <p>This site is protected by reCAPTCHA and the Google
                <a href="https://policies.google.com/privacy">Privacy Policy</a> and
                <a href="https://policies.google.com/terms">Terms of Service</a> apply.
              </p>
              <q-stepper-navigation>
                <q-btn color="primary" :label="$t('requestAccess')" type="submit" />
                <q-btn flat @click="step = 3" color="primary" label="Back" class="q-ml-sm" />
              </q-stepper-navigation>
            </q-step>
          </q-stepper>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useQuasar } from 'quasar'

import { useRouter } from 'vue-router'
import { useAuthenticationStore}  from '../stores/authentication/pinia-authentication'
import { Utils } from 'src/util'
import { useAxiosStore } from 'src/stores/axios-store'

export default defineComponent({
  name: 'PageRegister',

  preFetch() {
    const authenticationStore = useAuthenticationStore()
    if(authenticationStore.isLoggedIn){
      this.$router.push('/')
    }
  },

  setup() {
    const $q = useQuasar()

    const $router = useRouter()
    // @ts-ignore
    const { executeRecaptcha, recaptchaLoaded } = useReCaptcha()

    const step = ref(1)
    const name = ref('')
    const email = ref('')
    const reasonForInterest = ref('')
    const versionInterest = ref('')
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    function present(val: string) {
      return val && val.length > 0
    }

    function validEmail(val: string) {
      return emailRegex.test(val)
    }

    function stepOneComplete() {
      return (
        present(name.value) &&
        present(email.value) &&
        validEmail(email.value)
      )
    }

    function stepTwoComplete() {
      return present(reasonForInterest.value)
    }

    function stepThreeComplete() {
      return present(versionInterest.value)
    }

    async function onSubmit() {
      await recaptchaLoaded()
      const recaptcha = await executeRecaptcha('accessRequest')
      const api = useAxiosStore().axios()

      api.post('/access-request', {
        name: name.value,
        email: email.value,
        reason_for_interest: reasonForInterest.value,
        version: versionInterest.value,
        recaptcha: recaptcha
      }).then(
        (response) => {
          step.value = 1
          name.value = ''
          email.value = ''
          reasonForInterest.value = ''
          versionInterest.value = ''
          void $router.push({ path: '/login' })
          // clear out form and redirect to login
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Successfully requested access!',
            icon: 'fas fa-laptop-code'
          })
        },
        Utils.handleError('Failed to request access')
      )
    }

    return {
      step,
      name,
      email,
      present,
      validEmail,
      reasonForInterest,
      versionInterest,
      stepOneComplete,
      stepTwoComplete,
      stepThreeComplete,
      onSubmit
    };
  }
});
</script>
