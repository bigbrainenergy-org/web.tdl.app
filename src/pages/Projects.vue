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
                      node-key="id"
                      label-key="title"
                      children-key="subprojects"
                      dense
                    >
                      <template v-slot:default-header="prop">
                        <q-item class="fit q-ml-md" clickable v-ripple @click.stop="doThing(prop)">
                          <q-item-section
                            :class="(prop.node.next_actions.length === 0) ? 'text-red' : null"
                          >
                            {{ prop.node.title }}
                          </q-item-section>

                          <q-item-section side>
                            <q-badge
                              :color="(prop.node.next_actions.length > 0) ? 'white' : 'negative'"
                              :class="(prop.node.next_actions.length > 0) ? 'text-black' : null"
                            >
                              {{ prop.node.next_actions.length }}
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
                    <div class="text-h4 q-mb-lg">{{ selectedProject.title }}</div>
                    <p style="white-space: pre-line;">{{ selectedProject.notes }}</p>
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

<script>
import { defineComponent, ref, computed } from 'vue'
import { useStore } from '../store'

import Project from '../models/project'
import { Project as ProjectInterface } from '../components/models'

export default defineComponent({
  name: 'PageProjects',

  setup() {
    const $store = useStore()

    // TODO: Lazy load subprojects
    const projects = computed(
      () => $store.$repo(Project).withAllRecursive().get().filter(
        (project) => {
          return project.superprojects.length === 0
        }
      )
    )

    const selectedProject = ref(null)
    const projectSplitter = ref(50)

    function doThing(prop) {
      if (selectedProject.value?.id == prop.node?.id) {
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
