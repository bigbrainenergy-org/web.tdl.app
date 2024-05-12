<template>
  <q-drawer
      v-model="model"
      side="left"
      elevated
      dark
      show-if-above
      :width="200"
      :breakpoint="500"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item v-ripple clickable>
            <q-item-section avatar>
              <q-icon name="add" />
            </q-item-section>

            <q-item-section>
              Add Task
            </q-item-section>
          </q-item>

          <q-item v-ripple clickable>
            <q-item-section avatar>
              <q-icon name="search" />
            </q-item-section>

            <q-item-section>
              Search
            </q-item-section>
          </q-item>

          <q-item v-ripple clickable>
            <q-item-section avatar>
              <q-icon name="inbox" />
            </q-item-section>

            <q-item-section>
              Inbox
            </q-item-section>
          </q-item>
        </q-list>

        <p class="q-ma-sm text-bold text-h6">Lists</p>

        <q-list padding>
          <q-item
            v-for="list, key in lists"
            :key="key"
            v-ripple
            clickable
          >
            <q-item-section avatar>
              <q-icon name="tag" :style="`color: ${list.color};`" />
            </q-item-section>

            <q-item-section>
              {{ list.title }}
            </q-item-section>

            <q-item-section side>
              {{ list.tasks.length }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRepo } from 'pinia-orm'
import { ListRepo } from 'src/stores/lists/list'

const model = defineModel(false)

const listsRepo = useRepo(ListRepo)

const lists = computed(
  () => listsRepo.withAll().get()
)
</script>
