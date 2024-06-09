<template>
  <q-input
    v-model="currentPassword"
    class="q-my-md"
    filled
    type="password"
    label="Current Password"
    name="current_password"
  />
  <q-input
    v-model="newPassword"
    class="q-my-md"
    filled
    type="password"
    label="New Password"
    name="new_password"
  />
  <q-input
    v-model="confirmPassword"
    class="q-my-md"
    filled
    type="password"
    label="Confirm Password"
    name="confirm_password"
  />
  <q-btn
    class="full-width"
    color="orange"
    outline
    label="Change Password"
    @click="changePassword"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRepo } from 'pinia-orm'
import { UserRepo } from 'src/stores/users/user'
import { Utils } from 'src/util'

const $q = useQuasar()
const userRepo = computed(() => useRepo(UserRepo))

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

function changePassword() {
  if(newPassword.value !== confirmPassword.value) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: 'New password and confirm password didn\'t match, please try again',
      icon: 'report_problem'
    })
    newPassword.value = ''
    confirmPassword.value = ''
    return
  }
  userRepo.value.changePassword({
    current_password: currentPassword.value,
    password: newPassword.value
  }).
  then(
    () => {
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      $q.notify({
        color: 'positive',
        position: 'top',
        message: 'Password changed!'
      })
    },
    Utils.handleError('Failed to change password.')
  )
}
</script>
