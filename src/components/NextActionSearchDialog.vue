<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" :maximized="true">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">{{ dialogTitle }}</div>
        <q-btn class="q-ma-sm" size="md" color="grey" label="close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12">
            <template v-if="nextAction">
              <div class="text-h5 text-primary">{{ nextAction.title }}</div>
              <q-separator class="q-my-md" />
            </template>

            <q-input
              v-model="search"
              filled
              clearable
              @update:model-value="searchForNextActions"
              @keyup.enter="searchForNextActions"
              debounce="1000"
              :label="searchLabel"
            >
              <template v-slot:append>
                <q-btn
                  round
                  flat
                  dense
                  icon="search"
                  @click="searchForNextActions"
                />
              </template>
            </q-input>

            <br>

            <template v-if="search">
              <q-separator class="q-my-md" />
              <div class="text-h4 q-mb-md">{{ resultsTitle }} - {{ results.length }}</div>
              <q-list>
                <q-item clickable v-ripple v-if="!results.length">
                  <q-item-section>No results found</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-ripple
                  v-for="nextAction in results"
                  :key="nextAction.id"
                  @click="selectNextAction(nextAction)"
                >
                  <q-item-section>
                    {{ nextAction.title }}
                  </q-item-section>
                </q-item>
              </q-list>
            </template>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { useStore } from '../store'
import {
  defineComponent,
  PropType,
  computed,
  ref,
  toRef,
  Ref,
} from 'vue';
import Fuse from 'fuse.js'

import NextAction from '../models/next_action'

export default {
  props: {
    dialogTitle: {
      type: String,
      required: true
    },
    searchLabel: {
      type: String,
      default: () => 'Search'
    },
    resultsTitle: {
      type: String,
      default: () => 'Possible matches'
    },
    nextAction: {
      type: Object,
      required: true
    }
  },

  emits: [
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits,
    'select',
  ],

  setup (props, { emit }) {
    const $store = useStore()

    // REQUIRED; must be called inside of setup()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    // dialogRef      - Vue ref to be applied to QDialog
    // onDialogHide   - Function to be used as handler for @hide on QDialog
    // onDialogOK     - Function to call to settle dialog with "ok" outcome
    //                    example: onDialogOK() - no payload
    //                    example: onDialogOK({ /*.../* }) - with payload
    // onDialogCancel - Function to call to settle dialog with "cancel" outcome

    const search = ref('')
    const results = ref([])

    const searchOptions = {
      isCaseSensitive: false,
      ignoreLocation: true,
      keys: ['title']
    }

    function searchForNextActions() {
      if(!search.value) { return } // Guard clause if search is empty

      const nextActions = $store.$repo(NextAction).withAll().get()

      const fuse = new Fuse(nextActions, searchOptions)

      // unsanitized user input being fed into a library? what could go wrong.
      // FIXME: AKA this is a vuln waiting to happen, fix it.
      const run = fuse.search(search.value)

      results.value = nextActions.filter(
        (nextAction) => {
          return run.some(
            (searchElement) => {
              return (searchElement.item.id === nextAction.id)
            }
          )
        }
      ).sort(
        (first, second) => {
          const firstIndex = run.findIndex(
            (element) => { return element.item.title == first.title }
          )
          const secondIndex = run.findIndex(
            (element) => { return element.item.title == second.title }
          )
          return firstIndex - secondIndex
        }
      )
    }

    function selectNextAction(nextAction) {
      emit('select', { nextAction: nextAction, callback: searchForNextActions })
    }

    return {
      // Custom stuff
      search,
      results,
      searchForNextActions,
      selectNextAction,
      //

      // This is REQUIRED;
      // Need to inject these (from useDialogPluginComponent() call)
      // into the vue scope for the vue html template
      dialogRef,
      onDialogHide,

      // other methods that we used in our vue html template;
      // these are part of our example (so not required)
      onOKClick () {
        // on OK, it is REQUIRED to
        // call onDialogOK (with optional payload)
        onDialogOK()
        // or with payload: onDialogOK({ ... })
        // ...and it will also hide the dialog automatically
      },

      // we can passthrough onDialogCancel directly
      onCancelClick: onDialogCancel
    }
  }
}
</script>
