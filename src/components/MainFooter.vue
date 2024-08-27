<template>
  <q-footer elevated class="bg-grey-8 text-white">
    <q-tabs shrink :inline-label="!$q.screen.lt.sm" :dense="$q.screen.lt.sm">
      <q-route-tab
        icon="fa-solid fa-list-check"
        to="/list"
        label="List"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
      <q-route-tab
        icon="fa-solid fa-calendar-day"
        to="/calendar"
        label="Calendar"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
      <q-route-tab
        icon="fa-solid fa-project-diagram"
        to="/tree"
        label="Tree"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
      <q-route-tab
        icon="hub"
        to="/graph"
        label="Graph"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
      <q-route-tab
        icon="self_improvement"
        to="/focus"
        label="Focus"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
    </q-tabs>
  </q-footer>
</template>

<script setup lang="ts"></script>
