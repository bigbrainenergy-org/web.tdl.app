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
            <q-splitter v-model="projectSplitter">
              <template v-slot:before>
                <div class="q-pa-md">
                  <q-list>
                    <q-tree
                      :nodes="projects"
                      node-key="title"
                      label-key="title"
                      children-key="subprojects"
                      default-expand-all
                      dense
                    >
                      <template v-slot:default-header="prop">
                        <q-item class="fit q-ml-md" clickable v-ripple @click.stop="doThing(prop)">
                          <q-item-section
                            :class="(prop.node.next_action_count === 0) ? 'text-red' : null"
                          >
                            {{ prop.node.title }}
                          </q-item-section>

                          <q-item-section side>
                            <q-badge
                              :color="(prop.node.next_action_count > 0) ? 'white' : 'negative'"
                              :class="(prop.node.next_action_count > 0) ? 'text-black' : null"
                            >
                              {{ prop.node.next_action_count }}
                            </q-badge>
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

              <template v-slot:after>
                <div class="q-pa-md">
                  <template v-if="selectedProject">
                    <p>{{ selectedProject.title }}</p>
                    <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
                  </template>

                  <template v-else>
                    <p>No project selected</p>
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

<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({
  name: 'PageProjects',

  setup() {
    const projects = ref([
      {
        title: 'Implement projects tab',
        next_action_count: 7,
      },
      {
        title: 'Implement inbox tab',
        next_action_count: 3,
      },
      {
        title: 'Implement next actions tab',
        next_action_count: 0,
        subprojects: [
          { title: 'Implement next action review?', next_action_count: 2 },
          { title: 'Other thing', next_action_count: 0 }
        ]
      },
      {
        title: 'Implement waiting for tab',
        next_action_count: 5,
      },
      {
        title: 'Implement daily review dialog',
        next_action_count: 0,
        subprojects: [
          {
            title: 'Something related to daily review',
            next_action_count: 1,
            subprojects: [
              { title: 'Triple nesting action!', next_action_count: 8 },
              {
                title: 'With two things!',
                next_action_count: 0,
                subprojects: [
                  { title: 'And even more nesting after that!', next_action_count: 4 },
                  { title: 'Truly wild', next_action_count: 69 }
                ]
              }
            ]
          },
          { title: 'Another daily review thing', next_action_count: 1337 }
        ]
      },
      {
        title: 'Implement weekly review dialog',
        next_action_count: 1,
      },
      {
        title: 'Implement API backend',
        next_action_count: 1,
      },
    ])

    const selectedProject = ref(null)
    const projectSplitter = ref(50)

    function doThing(prop: any) {
      if (selectedProject.value == prop.node) {
        selectedProject.value = null
      } else {
        selectedProject.value = prop.node
      }
    }

    return {
      projects,
      selectedProject,
      projectSplitter,
      doThing
    }
  }
});
</script>
