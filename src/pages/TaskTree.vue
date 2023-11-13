<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height q-pl-md text-primary" style="background-color: #1d1d1df6">
          <q-btn @click="expandedNodes = []">COLLAPSE ALL</q-btn>
          <q-btn @click="console.debug({expandedNodes, 'expandedState': esr.all()})">DEBUG</q-btn>
          <q-tree
          :nodes="layerZero"
          node-key="key"
          dense
          @lazy-load="loadPostreqs"
          ref="theTree"
          @update:expanded="onExpanded"
          v-model:expanded="expandedNodes"
          class="text-primary"
          >
            <template v-slot:default-header="prop">
              <q-item class="text-primary">
                <q-item-label @click="openTask(prop.node.obj)">
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
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import UpdateTaskDialog from 'src/components/UpdateTaskDialog.vue'
import { details, QTreeComponent, SimpleTreeNode } from 'src/quasar-interfaces'
import { Utils } from 'src/util'
import { ExpandedStateRepo } from 'src/stores/expanded-state/expanded-state'

const tr = computed(() => useRepo(TaskRepo))
const esr = computed(() => useRepo(ExpandedStateRepo))

const layerZeroTasks = (): SimpleTreeNode<Task>[] => {
  const nodes = tr.value.where((x) => !x.hasPrereqs).get().map((x) => (x.treeNode()))
  console.debug({'layer zero tasks': nodes})
  return nodes
}

const layerZero = ref(layerZeroTasks())

let allTaskNodes = Array.from(layerZero.value)

const theTree = ref<QTreeComponent<Task> | undefined>()

type NodeKey = {
  id: number,
  key: string
}

// forgive me
let queueCollapse: NodeKey[] = []
const collapseNodesInQueue = () => {
  const t = theTree.value
  if(typeof t === 'undefined') throw new Error('tree ref was undefined')
  queueCollapse = queueCollapse.filter((x) => t.isExpanded(x.key))
  if(queueCollapse.length === 0) {
    previousExpanded = expandedNodes.value
    return
  }
  expandedNodes.value = expandedNodes.value.filter((x) => queueCollapse.findIndex((y) => y.key === x) === -1)
  setTimeout(collapseNodesInQueue, 1)
}

// i hate that this works
let queueExpand: NodeKey[] = []
const expandNodesInQueue = () => {
  const t = Utils.hardCheck(theTree.value, 'tree ref was undefined')
  queueExpand = queueExpand.filter((x) => !t.isExpanded(x.key))
  if(queueExpand.length === 0) {
    previousExpanded = expandedNodes.value
    return
  }
  const stuckNodes = queueExpand.filter((x) => expandedNodes.value.includes(x.key))
  if(stuckNodes.length > 0) {
    stuckNodes.forEach((x) => t.setExpanded(x.key, true))
  }
  else {
    expandedNodes.value.push(...queueExpand.map((x) => x.key))
  }
  setTimeout(expandNodesInQueue, 1)
}

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

const loadPostreqs = (d: details<Task>) => {
  console.debug('loadPostreqs of ', d.node.key)
  esr.value.setKeyExpanded(d.node.key, true)
  tr.value.with('hard_postreqs').load([d.node.obj])
  const postreqTreeNodes = d.node.obj.hard_postreqs.map((x) => x.treeNode(d.node.key))
  console.debug({ postreqTreeNodes })
  postreqTreeNodes.filter((x) => esr.value.isExpanded(x.id ?? -1) === true).forEach((x) => queueExpand.push({ id: x.id, key: x.key }))
  d.done(postreqTreeNodes)
  allTaskNodes.push(...postreqTreeNodes)
  handleExpandAndCollapse()
}

// this MUST be set in order for onExpanded to work.
const expandedNodes = ref<string[]>([])

let previousExpanded: string[] = []

const onExpanded = (list: readonly any[]) => {
  const delta = previousExpanded.length - list.length
  if(delta > 0) {
    const diff: string[] = previousExpanded.filter((x) => !list.includes(x)) // anything no longer in the list of expanded tasks
    if(diff.length !== 0) {
      diff.forEach((key) => esr.value.setKeyExpanded(key, false))
      console.debug({'setToCollapsed': diff})
    }
    else {
      console.error('wut', {previousExpanded, list})
    }
  }
  else if(delta < 0) {
    const diff: string[] = list.filter((x) => !previousExpanded.includes(x as string)) // anything new to the list of expanded tasks
    if(diff.length !== 0) {
      diff.forEach((key) => esr.value.setKeyExpanded(key, true))
      console.debug({'setToExpanded': diff})
    }
    else {
      console.error('wut', {previousExpanded, list})
    }
  }
  handleExpandAndCollapse()
  previousExpanded = list as string[]
}

const handleExpandAndCollapse = () => {
  console.debug('handleExpandAndCollapse')
  const t = Utils.hardCheck(theTree.value)
  allTaskNodes.forEach((x) => {
    const shouldBeExpanded = esr.value.isExpanded(x.id)
    if(t.isExpanded(x.key) !== esr.value.isExpanded(x.id)) {
      console.log(x.key, ' needs to be ', shouldBeExpanded ? 'expanded' : 'collapsed')
      if(shouldBeExpanded) {
        queueExpand.push({ id: x.id, key: x.key })
      }
      else {
        queueCollapse.push({ id: x.id, key: x.key })
      }
    }
  })
  if(queueExpand.length !== 0) {
    console.debug('handleExpandAndCollapse: expanding nodes in queue')
    console.debug({queueExpand})
    expandNodesInQueue()
  }
  if(queueCollapse.length !== 0) {
    console.debug('handleExpandAndCollapse: collapsing nodes in queue')
    console.debug({queueCollapse})
    collapseNodesInQueue()
  }
  else if(queueCollapse.length === 0 && queueExpand.length === 0) {
    console.debug('nothing to expand or collapse')
  }
  console.debug('= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =')
}

onMounted(() => {
  console.debug('onMounted')
  console.log(esr.value.all())
  handleExpandAndCollapse()
})

// todo: on page load, expand all tasks that have expanded = true in their store.

</script>
