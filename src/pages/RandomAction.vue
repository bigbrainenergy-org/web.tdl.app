<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section class="bg-primary text-white">
            <div class="row">
              <div class="col">
                <div class="text-h6">Random Task</div>
              </div>
            </div>
            <div class="row">
              <q-btn @click="randomAction()">randomize</q-btn>
            </div>
          </q-card-section>
          <q-card-section class="q-pa-none">
            <div class="q-pa-md">
              <q-item class="fit q-ml-md" clickable v-ripple @click.stop="openNextAction(selectedAction)" v-if="selectedAction">
                <q-item-section> {{ selectedAction.title }} </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="(selectedAction.hard_postreqs.length > 0) ? 'white' : 'negative'"
                    :class="(selectedAction.hard_postreqs.length > 0) ? 'text-black' : null"
                  >
                    {{ selectedAction.hard_postreqs.length }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
  import { useQuasar } from 'quasar'
  import { defineComponent, ref, computed } from 'vue'
  import { useStore } from '../store'
  import NextAction from '../models/next_action'
  import { NextAction as NextActionInterface } from '../components/models'
  import UpdateNextActionDialog from 'components/UpdateNextActionDialog.vue'
  export default defineComponent({
    name: 'PageRandomAction',
    setup() {
      const $q = useQuasar()
      const $store = useStore()

      const nextactions = computed(
        () => $store.$repo(NextAction).withAllRecursive().get().filter(
          (nextaction: any) => {
            return (nextaction.hard_prereqs.length === 0)
          }
        )
      )

      function randomAction() {
        selectedAction.value = nextactions.value[Math.floor(Math.random()*nextactions.value.length)]
        console.log('selected: ', selectedAction.value)
      }

      function openNextAction(next_action: NextActionInterface) {
        $q.dialog({
          component: UpdateNextActionDialog,

          componentProps: {
            next_action: next_action
          }
        })
        randomAction()
      }

      const selectedAction = ref({})
      randomAction()

      return {
        nextactions,
        selectedAction,
        openNextAction,
        randomAction
      }
    }
  })
</script>
