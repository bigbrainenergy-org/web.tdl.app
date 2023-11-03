<template>
  <q-layout view="hHh Lpr lFf">
    <q-footer elevated class="bg-grey-8 text-white">
      <q-tabs shrink inline-label>
        <q-route-tab icon="fas fa-sign-in-alt" to="/login" label="Login" />
        <q-route-tab icon="fas fa-laptop-code" to="/request-access" label="Request Access" />
      </q-tabs>
    </q-footer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
console.warn('In Guest Layout')
</script>
