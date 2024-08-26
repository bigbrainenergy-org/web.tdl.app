<template>
  <q-btn dense flat no-wrap>
    <q-avatar rounded size="32px">
      <q-icon name="fas fa-user-circle" />
    </q-avatar>
    <q-icon name="arrow_drop_down" size="24px" />

    <q-menu auto-close>
      <q-list>
        <q-item>
          <q-item-section class="text-center">
            <div class="text-pain">Logged in as:</div>
            <div class="text-glitch text-h4" :data-text="username">
              {{ username }}
            </div>
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable @click="$router.push({ path: '/settings' })">
          <q-item-section>{{ $t('settings') }}</q-item-section>
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable @click="logout">
          <q-item-section>Logout/Change Server</q-item-section>
          <q-item-section avatar>
            <q-icon name="fas fa-sign-out-alt" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable @click="pullFresh">
          <q-item-section>Pull Latest From Server</q-item-section>
          <q-item-section avatar>
            <q-icon name="fas fa-sign-out-alt" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <q-menu context-menu auto-close>
      <q-list>
        <q-item clickable>
          <q-item-section>Testing</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRepo } from 'pinia-orm'
  import { UserRepo } from 'src/stores/users/user'

  const ur = useRepo(UserRepo)

  const username = computed(() => {
    return (ur.getUser() ?? { username: 'guest' }).username
  })
</script>
