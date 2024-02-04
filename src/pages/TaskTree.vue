<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height q-pl-md text-primary" style="background-color: #1d1d1df6">
          <q-card-actions>
            <SettingsButton v-model:settings="taskTreeSettings" name="Task Tree Settings" />
          </q-card-actions>
          <q-tree
          :nodes="layerZeroTasks"
          node-key="key"
          dense
          @lazy-load="loadPostreqs"
          ref="theTree"
          @update:expanded="onExpanded"
          v-model:expanded="expandedNodes"
          class="text-primary">
            <template v-slot:default-header="prop">
              <q-item class="text-primary" :style="style(prop.node.obj)">
                <q-checkbox v-model:model-value="prop.node.obj.completed" @update:model-value="updateTaskCompletedStatus(prop.node.obj)" color="primary" keep-color></q-checkbox>
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
import UpdateTaskDialog from 'src/components/dialog/UpdateTaskDialog.vue'
import { details, QTreeComponent, SimpleTreeNode } from 'src/quasar-interfaces'
import { Utils } from 'src/util'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { ExpandedStateRepo } from 'src/stores/task-meta/expanded-state'
import SettingsButton from 'src/components/SettingsButton.vue'

const tr = computed(() => useRepo(TaskRepo))
const esr = computed(() => useRepo(ExpandedStateRepo))
const usr = useLocalSettingsStore()

const toggleRGB = ref(false)

const incompleteOnly = ref(usr.hideCompleted)
const expandAllWithSameID = ref(usr.expandAllWithSameID)

const taskTreeSettings = ref({ 'Incomplete Only': incompleteOnly, 'Expand Task Everywhere It\'s Found': expandAllWithSameID, 'Enable RGB': toggleRGB})

const updateLocalSettings = () => {
  usr.hideCompleted = incompleteOnly.value
  usr.expandAllWithSameID = expandAllWithSameID.value
}

const style = (task: Task) => {
  return {
    backgroundColor: toggleRGB.value ? task.hashColor() : undefined,
    innerWidth: '100%'
  }
}

const layerZeroTasks = computed((): SimpleTreeNode<Task>[] => {
  const allTasks = tr.value.withAll().get()
  const layerZero = allTasks.filter(x => (incompleteOnly.value ? !x.completed : true) && x.hard_prereqs.filter(y => !y.completed).length === 0)
  const nodes = layerZero.map((x) => (x.treeNode()))
  console.debug({'layer zero tasks': nodes})
  return nodes
})

let allTaskNodes = Array.from(layerZeroTasks.value)

console.debug({ colors: allTaskNodes.map((x) => x.obj.hashColor() )})

const theTree = ref<QTreeComponent<Task>>()

type NodeKey = {
  id: number,
  key: string
}

// forgive me
let queueCollapse: NodeKey[] = []
const collapseNodesInQueue = () => {
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

const updateTaskCompletedStatus = (task: Task) => {
  tr.value.update({ id: Utils.hardCheck(task.id), payload: { task }})
}

const loadPostreqs = (d: details<Task>) => {
  //console.debug('loadPostreqs of ', d.node.key)
  esrc.setExpanded(d.node.id, true)
  const postreqTreeNodes = d.node.obj.hardPostreqTreeNodes()
  //console.debug({ postreqTreeNodes })
  postreqTreeNodes.filter((x) => esrc.isExpanded(x.id ?? -1) === true).forEach((x) => queueExpand.push({ id: x.id, key: x.key }))
  d.done(postreqTreeNodes)
  allTaskNodes.push(...postreqTreeNodes)
  handleExpandAndCollapse()
}

// this MUST be set in order for onExpanded to work.
const expandedNodes = ref<string[]>([])

let previousExpanded: string[] = []

const onExpanded = (list: readonly any[]) => {
  if(!expandAllWithSameID.value) return
  const delta = previousExpanded.length - list.length
  if(delta > 0) {
    const diff: string[] = previousExpanded.filter((x) => !list.includes(x)) // anything no longer in the list of expanded tasks
    if(diff.length !== 0) {
      diff.forEach((key) => esr.value.setKeyExpanded(key, false))
      // console.debug({'setToCollapsed': diff})
    }
    else {
      console.error('wut', {previousExpanded, list})
    }
  }
  else if(delta < 0) {
    const diff: string[] = list.filter((x) => !previousExpanded.includes(x as string)) // anything new to the list of expanded tasks
    if(diff.length !== 0) {
      diff.forEach((key) => esr.value.setKeyExpanded(key, true))
      // console.debug({'setToExpanded': diff})
    }
    else {
      console.error('wut', {previousExpanded, list})
    }
  }
  handleExpandAndCollapse()
  previousExpanded = list as string[]
}

const esrc = esr.value
const handleExpandAndCollapse = () => {
  if(!expandAllWithSameID.value) return
  // console.debug('handleExpandAndCollapse')
  let shouldBeExpanded
  allTaskNodes.forEach((x) => {
    shouldBeExpanded = esrc.isExpanded(x.id)
    if(t.isExpanded(x.key) !== shouldBeExpanded) {
      // console.log(x.key, ' needs to be ', shouldBeExpanded ? 'expanded' : 'collapsed')
      if(shouldBeExpanded) queueExpand.push({ id: x.id, key: x.key })
      else queueCollapse.push({ id: x.id, key: x.key })
    }
  })
  if(queueExpand.length !== 0) {
    // console.debug('handleExpandAndCollapse: expanding nodes in queue')
    // console.debug({queueExpand})
    expandNodesInQueue()
  }
  if(queueCollapse.length !== 0) {
    // console.debug('handleExpandAndCollapse: collapsing nodes in queue')
    // console.debug({queueCollapse})
    collapseNodesInQueue()
  }
}

let t: QTreeComponent<Task>

onMounted(() => {
  console.debug('onMounted')
  t = Utils.hardCheck(theTree.value)
  handleExpandAndCollapse()
})

</script>
