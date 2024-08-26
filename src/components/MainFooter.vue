<template>
  <q-footer elevated class="bg-grey-8 text-white">
    <q-tabs shrink :inline-label="!$q.screen.lt.sm" :dense="$q.screen.lt.sm">
      <q-route-tab
        icon="fa-solid fa-circle-dot"
        to="/focus"
        label="Focus"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
      <q-route-tab
        icon="fa-solid fa-inbox"
        to="/tasks"
        label="Tasks"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
      <q-route-tab
        icon="fa-solid fa-inbox"
        to="/josh-page"
        label="Josh"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
      <q-route-tab
        icon="fa-solid fa-inbox"
        to="/agenda"
        label="Agenda"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
      <q-route-tab
        icon="fa-solid fa-project-diagram"
        to="/lists"
        label="Lists"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
      <q-route-tab
        icon="fa-solid fa-project-diagram"
        to="/tasks-tree"
        label="Tree"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
      <q-route-tab
        icon="fa-solid fa-project-diagram"
        to="/graph"
        label="Graph"
        :class="$q.screen.lt.sm ? 'q-pt-sm' : null"
      />
    </q-tabs>
  </q-footer>
</template>

<script setup lang="ts"></script>
