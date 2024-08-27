<template>
  <FullPage>
    <TransparentCard>
      <template #header>
        <PainHeader>Tasks</PainHeader>
      </template>

      <template #body>Calendar goes here</template>
    </TransparentCard>
  </FullPage>
</template>

<script setup lang="ts">
  import { useMeta } from 'quasar'

  import FullPage from 'src/components/FullPage.vue'
  import TransparentCard from 'src/components/TransparentCard.vue'
  import PainHeader from 'src/components/PainHeader.vue'

  useMeta(() => ({ title: 'Calendar | TDL App' }))
</script>
