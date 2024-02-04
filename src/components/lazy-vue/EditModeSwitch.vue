<script setup lang="ts">
const mode = defineModel<boolean>('mode')
</script>
<template>
  <q-toggle v-model="mode" label="EDIT" left-label checked-icon="edit" unchecked-icon="visibility"/>
</template>
