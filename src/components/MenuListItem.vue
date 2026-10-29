<template>
  <q-item
    v-close-popup="!(menuItem.items?.length)"
    clickable
    style="min-width: 180px"
    @click.stop="menuItem.action(item)"
  >
    <q-item-section lines="1">{{ menuItem.label }}</q-item-section>
    <q-item-section side>
      <q-icon :name="menuItem.items ? 'keyboard_arrow_right' : menuItem.icon" />
    </q-item-section>
    <q-menu v-if="menuItem.items" anchor="top end" self="top start">
      <MenuListItem v-for="(mi, index) in menuItem.items" :key="index" :menu-item="mi" :item="item" />
    </q-menu>
  </q-item>
</template>

<script setup lang="ts" generic="T">
  import type { SimpleMenuItem } from 'src/utils/types'

  interface Props {
    menuItem: SimpleMenuItem<T>
    item: T
  }
  defineProps<Props>()
</script>