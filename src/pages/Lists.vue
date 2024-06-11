<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height" style="background-color: #1d1d1df6">
          <q-card-section class="bg-primary text-white">
            <div class="row">
              <div class="col">
                <div class="text-h6">Lists</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section class="q-pa-none">
            <q-splitter v-model="listSplitter">
              <template #before>
                <div class="q-pa-md">
                  <q-list class="text-primary">
                    <q-tree
                      :nodes="lists"
                      node-key="id"
                      label-key="title"
                      children-key="sublists"
                      dense
                    >
                      <template #default-header="prop">
                        <q-item
                          v-ripple
                          class="fit q-ml-md text-primary"
                          clickable
                          @click.stop="doThing(prop)"
                        >
                          <q-item-section>
                            {{ prop.node.title }}
                          </q-item-section>

                          <q-menu context-menu auto-close>
                            <q-list>
                              <q-item clickable>
                                <q-item-section>Testing (tree)</q-item-section>
                              </q-item>
                            </q-list>
                          </q-menu>
                        </q-item>
                      </template>
                    </q-tree>
                  </q-list>
                </div>
              </template>

              <template #after>
                <div class="q-pa-md">
                  <template v-if="selectedList">
                    <div class="text-h4 q-mb-lg text-primary">
                      {{ selectedList.title }}
                    </div>
                    <p style="white-space: pre-line" class="text-primary">
                      {{ selectedList.notes }}
                    </p>
                  </template>

                  <template v-else>
                    <p class="text-primary">No list selected</p>
                  </template>
                </div>
              </template>
            </q-splitter>
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

<script setup lang="ts">
  import { defineComponent, ref, computed } from 'vue'
  import { useRepo } from 'pinia-orm'
  import { List, ListRepo } from 'src/stores/lists/list'
  import { Utils } from 'src/util'

  defineComponent({
    name: 'PageLists'
  })

  const repo = useRepo(ListRepo)

  await repo.fetch()

  //TODO: lazy load this list
  const lists = computed(() => repo.withAllRecursive().get())

  const selectedList = ref<List | null>(null)
  const listSplitter = ref(50)

  function doThing(prop: any) {
    console.debug('doThing Fired with argument: ', { prop })
    //Utils.todo('fix doThing and rename it')
    if (selectedList.value?.id == prop.node?.id) {
      selectedList.value = null
    } else {
      selectedList.value = prop.node
    }
  }
</script>
