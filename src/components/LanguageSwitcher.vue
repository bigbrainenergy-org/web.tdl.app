<template>
  <q-select
    v-model="locale"
    :options="localeOptions"
    class="q-my-md"
    filled
    borderless
    emit-value
    map-options
  >
    <template v-slot:prepend>
      <q-icon name="fa fa-language" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale } = useI18n({ useScope: 'global' })
const localeOptions = [
  { value: 'en-US', label: 'English' },
  { value: 'ja', label: '日本語' }
]
</script>
