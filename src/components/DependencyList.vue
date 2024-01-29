<template>
  <div>
    <div class="row">
      <div class="col">
        <div class="text-h5">{{ dependencyType.plural }}</div>
      </div>
      <div class="col text-right">
        <q-btn color="primary" icon="fas fa-link" :label="addItemLabel" @click="emit('addItem')" />
      </div>
    </div>
    <q-list class="q-my-md">
      <q-item v-ripple v-if="!items.length">
        <q-item-section>No {{ dependencyType.plural }}</q-item-section>
      </q-item>
      <q-item
        v-ripple
        v-for="item, index in items"
        :key="index">
        <q-btn-dropdown style="width: 100%;" 
          split 
          auto-close
          dropdown-icon="more_vert" 
          @click.stop="emit('selectItem', item)">
          <template v-slot:label>
            <q-item-section avatar style="width: 10%;">
              <q-checkbox v-model:model-value="item.completed" @update:model-value="emit('toggleCompletedItem', item)"/>
            </q-item-section>
            <q-item-section class="vertical-top" style="width: 90%;">
              <q-item-label lines="2" style="text-wrap: wrap;">
                {{ item.title }}
              </q-item-label>
            </q-item-section>
          </template>
          <q-list>
            <q-item
            v-for="menuitem, index in menuItems"
            :key="index"
            v-close-popup
            clickable
            @click.stop="menuitem.action(item)">
              <q-item-label lines="1">{{ menuitem.label }}</q-item-label>
              <q-icon :name="menuitem.icon" />
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts" generic="T extends { completed: boolean, title: string }">
import { λ } from 'src/types'

export type SimpleMenuItem<T> = {
  label: string
  icon: string
  action: λ<T>
}

export interface EntityType {
  singular: string
  plural: string
}

interface Props {
  items: Array<T>
  dependencyType: EntityType // eg. Prerequisites (capitalize)
  menuItems: Array<SimpleMenuItem<T>>
}

const prop = defineProps<Props>()

const addItemLabel = `Add ${prop.dependencyType.plural}`

const emit = defineEmits([ 'addItem', 'removeItem', 'selectItem', 'toggleCompletedItem' ])
</script>