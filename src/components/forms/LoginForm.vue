<template>
  <q-form class="q-gutter-md" autofocus>
    <q-input v-model="server" filled :label="$t('server')" data-cy="server">
      <template #prepend>
        <q-icon name="fas fa-network-wired" />
      </template>
    </q-input>

    <q-input
      v-model="username"
      filled
      autofocus
      :label="$t('username')"
      data-cy="username"
      @keyup.enter="focusPassword"
    >
      <template #prepend>
        <q-icon name="account_circle" />
      </template>
    </q-input>

    <q-input
      ref="passwordInput"
      v-model="password"
      filled
      :label="$t('password')"
      type="password"
      data-cy="password"
      @keyup.enter="$emit('login', $event)"
    >
      <template #prepend>
        <q-icon name="lock" />
      </template>
    </q-input>
  </q-form>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const server = defineModel<string>('server')
  const username = defineModel<string>('username')
  const password = defineModel<string>('password')

  defineEmits(['login'])

  const passwordInput = ref()

  const focusPassword = () => {
    passwordInput.value?.focus()
  }
</script>
