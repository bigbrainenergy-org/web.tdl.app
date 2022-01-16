<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-pain">Next Actions</div>
                <div>{{ nextActions.length }} Items</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-list>
              <q-intersection
                v-for="(next_action, index) in nextActions"
                :key="next_action.id"
                once
                style="min-height: 48px;"
              >
                <q-item
                  clickable
                  v-ripple
                  @click="openNextAction(next_action)"
                >
                  <q-item-section>
                    {{ next_action.title }}
                  </q-item-section>

                  <q-item-section side v-if="next_action.notes">
                    <q-icon name="description">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        Has additional notes! Click to view.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>

                  <q-menu context-menu auto-close :ref="el => { if(el) nextActionMenus[index] = el }">
                    <q-list style="min-width: 100px">
                      <q-item clickable @click="openNextAction(next_action)">
                        <q-item-section>Open</q-item-section>
                        <q-item-section avatar>
                          <q-icon name="fas fa-external-link-alt" />
                        </q-item-section>
                      </q-item>

                      <q-separator />

                      <q-item clickable>
                        <q-item-section>Delete</q-item-section>
                        <q-item-section avatar>
                          <q-icon color="negative" name="fas fa-trash" />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-item>
              </q-intersection>
              <template v-if="nextActions.length === 0">
                <q-item clickable v-ripple>
                  <q-item-section>
                    <strong>Nothing yet!</strong>
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { computed, defineComponent, ref } from 'vue'
import { useStore } from '../store'

import NextAction from '../models/next_action'
import { NextAction as NextActionInterface } from 'components/models'
import UpdateNextActionDialog from 'components/UpdateNextActionDialog.vue'

export default defineComponent({
  name: 'PageNextActions',

  setup() {
    const $q = useQuasar()
    const $store = useStore()

    const nextActions = computed(
      () => $store.$repo(NextAction).withAll().get()
    )

    const nextActionMenus = ref([])

    function openNextAction(next_action: NextActionInterface) {
      $q.dialog({
        component: UpdateNextActionDialog,

        componentProps: {
          next_action: next_action
        }
      })
    }

    return {
      nextActions,
      nextActionMenus,
      openNextAction
    }
  }
});
</script>
