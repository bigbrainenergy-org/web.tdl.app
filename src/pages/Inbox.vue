<template>
  <q-page>
    <div class="row items-stretch justify-evenly q-col-gutter-md q-ma-md">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section class="bg-primary text-white">
            <div class="row">
              <div class="col">
                <div class="text-h6">Inbox</div>
              </div>
              <div class="col text-right">
                <q-btn color="positive">Begin Review</q-btn>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-list>
              <q-item clickable v-ripple v-for="task in 10">
                <q-item-section>Lorem Ipsum some shit goes here {{ task }}</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
export default defineComponent({
  name: 'PageInbox',
});
</script>
