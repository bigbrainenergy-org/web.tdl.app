<template>
  <SettingsButton v-model:settings="tasksPageSettings" />
  <q-space />
  <q-item-label class="text-primary">{{ tasks.length }} tasks</q-item-label>
  <q-space />
  <q-btn icon="fa-solid fa-signs-post" class="text-primary" @click="openQuickSortDialog" />
  <q-btn icon="fa-solid fa-search" class="text-primary" @click="openSearchDialog" />
</template>

<script setup land="ts"></script>
