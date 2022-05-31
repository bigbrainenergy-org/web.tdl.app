<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section class="bg-primary text-white">
            <div class="row">
              <div class="col">
                <div class="text-h6">Projects</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section class="q-pa-none">
             <div class="q-pa-md">
                  <q-list>
                    <q-tree
                      :nodes="nextactions"
                      node-key="id"
                      label-key="title"
                      children-key="hard_postreqs"
                      dense
                    >
                      <template v-slot:default-header="prop">
                        <q-item class="fit q-ml-md" clickable v-ripple @click.stop="doThing(prop)">
                          <q-item-section
                            :class="(prop.node.hard_postreqs.length === 0 && prop.node.hard_prereqs.length === 0) ? 'text-grey-8' : null"
                          >
                            {{ prop.node.title }}
                          </q-item-section>
                          <q-item-section side>
                            <q-badge
                              :color="(prop.node.hard_postreqs.length > 0) ? 'gray' : 'red'"
                              :class="(prop.node.hard_postreqs.length > 0) ? 'text-white' : 'text-white'"
                            >
                              {{ prop.node.hard_postreqs.length }}
                            </q-badge>
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-tree>
                  </q-list>
                </div>


          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-menu context-menu auto-close>
      <q-list>
        <q-item clickable>
          <q-item-section>Testing (page)</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-page>
</template>

<script>
import { useQuasar } from 'quasar'
import { defineComponent, ref, computed } from 'vue'
import { useStore } from '../store'

import NextAction from '../models/next_action'
import { NextAction as NextActionInterface } from '../components/models'
import UpdateNextActionDialog from '../components/UpdateNextActionDialog.vue'
export default defineComponent({
  name: 'PageTaskTree',

  setup() {
    const $q = useQuasar()
    const $store = useStore()

    // TODO: Lazy load subprojects
    const nextactions = computed(
      //todo
      () => $store.$repo(NextAction).withAllRecursive().get().filter(
        (nextaction) => {
          return nextaction.hard_prereq_ids.length === 0
        }
      )
    )

    const selectedAction = ref(null)

    function doThing(prop) {
      $q.dialog({
        component: UpdateNextActionDialog,
        componentProps: {
          next_action: prop.node
        }
      })
    }

    return {
      nextactions,
      selectedAction,
      doThing
    }
  }
});
</script>
