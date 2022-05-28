<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-pain">Waiting For</div>
                <div>{{ waitingFors.length }} Items</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-list>
              <q-item
                clickable
                v-ripple
                v-for="(waiting_for, index) in waitingFors"
                :key="waiting_for.id"
                @click="openWaitingFor(waiting_for)"
              >
                <q-item-section>
                  {{ waiting_for.title }}
                </q-item-section>

                <q-item-section side v-if="waiting_for.notes">
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

                <q-menu context-menu auto-close :ref="el => { if(el) waitingForMenus[index] = el }">
                  <q-list style="min-width: 100px">
                    <q-item clickable @click="openWaitingFor(waiting_for)">
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
              <template v-if="waitingFors.length === 0">
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

import WaitingFor from '../models/waiting_for'
import { WaitingFor as WaitingForInterface } from 'components/models'
import UpdateWaitingForDialog from 'components/UpdateWaitingForDialog.vue'

export default defineComponent({
  name: 'PageWaitingFor',

  setup() {
    const $q = useQuasar()
    const $store = useStore()

    const waitingFors = computed(
      () => $store.$repo(WaitingFor).all()
    )

    const waitingForMenus = ref([])

    function openWaitingFor(waiting_for: WaitingForInterface) {
      $q.dialog({
        component: UpdateWaitingForDialog,

        componentProps: {
          waiting_for: waiting_for
        }
      })
    }

    return {
      waitingFors,
      waitingForMenus,
      openWaitingFor
    }
  }
});
</script>
