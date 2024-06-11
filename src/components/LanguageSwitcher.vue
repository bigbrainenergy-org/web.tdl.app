<template>
  <q-select
    v-model="locale"
    :options="localeOptions"
    class="q-my-md"
    filled
    borderless
    emit-value
    map-options
    name="language_switcher"
  >
    <template #prepend>
      <q-icon name="fa fa-language" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  // import { ref } from 'vue'

  const { locale } = useI18n({ useScope: 'global' })
  // const locale = ref({})
  const localeOptions = [
    { value: 'en-US', label: 'English' },
    { value: 'ja', label: '日本語' }
  ]
</script>
