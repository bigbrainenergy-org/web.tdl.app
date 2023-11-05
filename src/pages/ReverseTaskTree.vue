<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height q-pl-md" style="background-color: #1d1d1df6">
          <q-tree
          :nodes="layerZeroTasks"
          node-key="key"
          dense
          @lazy-load="loadPrereqs"
          ref="theTree"
          v-model:expanded="expanded"
          @update:expanded="onExpanded"
          >
            <template v-slot:default-header="prop">
              <q-item>
                <q-item-label @click="openTask(prop.node.obj)" class="text-primary">
                  {{ prop.node.label }}
                </q-item-label>
              </q-item>
            </template>
          </q-tree>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRepo } from 'pinia-orm'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import UpdateTaskDialog from 'src/components/UpdateTaskDialog.vue'
import { details, QTreeComponent, SimpleTreeNode } from 'src/quasar-interfaces'
import { Utils } from 'src/util'

const tr = useRepo(TaskRepo)

const layerZeroTasks = computed((): SimpleTreeNode<Task>[] => {
  const x = tr.where((x) => x.hard_postreq_ids.length === 0).get().map((x) => ({
    id: x.id ?? -1,
    obj: x,
    label: x.title,
    expandable: x.hard_prereq_ids.length > 0,
    lazy: x.hard_prereq_ids.length > 0,
    key: x.id + '('
  }))
  console.debug({'layer zero tasks': x})
  return x
})

const $q = useQuasar()

const openTask = (currentTask: Task) => {
  console.debug(`opening UpdateTaskDialog with task of ${currentTask.title}`)
  $q.dialog({
    component: UpdateTaskDialog,

    componentProps: {
      task: currentTask
    }
  })
}

const treeRef = ref<QTreeComponent<Task> | undefined>()
const loadedTasks: Set<number> = new Set(layerZeroTasks.value.map((x) => x.id))

const toggleExpanded = (key: string, value: boolean) => {
  console.debug(`toggleExpanded ${key}`)
  Utils.hardCheck(treeRef.value).setExpanded(key, value)
}

const loadPrereqs = (d: details<Task>) => {
  d.node.obj.expanded = true
  setTimeout(() => {
    const prereqs = tr.with('hard_prereqs').where((x) => d.node.obj.hard_prereq_ids.includes(x.id)).get().map((x): SimpleTreeNode<Task> => {
      return {
        id: x.id ?? -1,
        obj: x,
        label: x.title,
        expandable: x.hard_prereq_ids.length > 0,
        lazy: x.hard_prereq_ids.length > 0,
        key: x.id + '(' + d.key + '.' + x.id + ')'
      }
    })
    setTimeout(() => {
      prereqs.forEach((x) => {
        if(x.obj.expanded) {
          toggleExpanded(x.key, true)
        }
      })
    }, 100)
    d.done(prereqs)
  }, 400)
}

const expanded = ref<any[]>([])

const onExpanded = (list: readonly any[]) => {
  console.debug({ list, 'vs expanded ref': expanded.value })

}

</script>
