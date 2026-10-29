<template>
  <q-btn icon="fa-solid fa-gear" class="text-white">
    <q-popup-proxy>
      <q-card class="q-pa-md" style="min-width: 280px">
        <q-item-label>Settings</q-item-label>
        <slot />
      </q-card>
    </q-popup-proxy>
  </q-btn>
</template>