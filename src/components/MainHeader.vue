<template>
  <q-header elevated>
    <q-toolbar>
      <header-buttons v-model:drawer="drawer" />

      <q-space />

      <header-user-menu />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
  import HeaderButtons from 'src/components/HeaderButtons.vue'
  import HeaderUserMenu from 'src/components/HeaderUserMenu.vue'

  const drawer = defineModel<boolean>('drawer')
</script>
