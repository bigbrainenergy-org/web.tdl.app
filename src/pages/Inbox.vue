<template>
  <q-page>
    <div class="row items-stretch justify-evenly q-col-gutter-md q-ma-md">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <div class="col">
                <div class="text-h6">Inbox</div>
                <div>{{ inboxItems.length }} Items</div>
              </div>
              <div class="col text-right">
                <q-btn color="positive" @click="openReviewDialog">Begin Review</q-btn>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-list>
              <q-item
                clickable
                v-ripple
                v-for="(inbox_item, index) in inboxItems"
                :key="inbox_item.id"
                @click="openInboxItem(inbox_item)"
              >
                <q-item-section>
                  {{ inbox_item.title }}
                </q-item-section>

                <q-item-section side v-if="inbox_item.notes">
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

                <q-menu context-menu auto-close :ref="el => { if(el) inboxItemMenus[index] = el }">
                  <q-list style="min-width: 100px">
                    <q-item clickable @click="openInboxItem(inbox_item)">
                      <q-item-section>Open</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="fas fa-external-link-alt" />
                      </q-item-section>
                    </q-item>

                    <q-separator />

                    <q-item clickable @click="openReviewDialog">
                      <q-item-section>Begin Review</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="fas fa-clipboard-list" />
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

import InboxItem from '../models/inbox_item'
import { InboxItem as InboxItemInterface } from 'components/models'
import UpdateInboxItemDialog from 'components/UpdateInboxItemDialog.vue'
import ReviewDialog from 'components/ReviewDialog.vue'

export default defineComponent({
  name: 'PageInbox',

  setup() {
    const $q = useQuasar()
    const $store = useStore()

    const inboxItems = computed(
      () => $store.$repo(InboxItem).all()
    )

    const inboxItemMenus = ref([])

    function openInboxItem(inbox_item: InboxItemInterface) {
      $q.dialog({
        component: UpdateInboxItemDialog,

        componentProps: {
          inbox_item: inbox_item
        }
      })
    }

    function openReviewDialog() {
      $q.dialog({
        component: ReviewDialog
      })
    }

    return {
      inboxItems,
      inboxItemMenus,
      openInboxItem,
      openReviewDialog
    }
  }
});
</script>

<style lang="sass">
.text-h6
  text-shadow: -0.06em 0 magenta, 0.06em 0 cyan
  color: black
</style>
