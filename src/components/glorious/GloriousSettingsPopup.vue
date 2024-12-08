<template>
  <q-btn icon="fa-solid fa-gear" class="text-white">
    <q-popup-proxy class="q-pa-md">
      <q-item-label>Settings</q-item-label>
      <slot />
    </q-popup-proxy>
  </q-btn>
</template>