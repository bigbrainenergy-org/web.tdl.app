<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card class="full-height q-pl-md text-primary" style="background-color: #1d1d1df6">
          <q-card-actions>
            <SettingsButton v-model:settings="taskTreeSettings" name="Task Tree Settings" />
          </q-card-actions>
          <q-tree
          :nodes="layerZero"
          node-key="key"
          dense
          @lazy-load="loadChildren"
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
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { details, QTreeComponent, SimpleTreeNode } from 'src/quasar-interfaces'
import { Utils } from 'src/util'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
// import { ExpandedStateRepo } from 'src/stores/task-meta/expanded-state'
import SettingsButton from 'src/components/SettingsButton.vue'
import { λ } from 'src/types'
import { TDLAPP } from 'src/TDLAPP'

const tr = computed(() => useRepo(TaskRepo))
// const esr = computed(() => useRepo(ExpandedStateRepo))
const usr = useLocalSettingsStore()

const toggleRGB = ref(false)
const reverseOrder = ref(false)

const incompleteOnly = ref(usr.hideCompleted)
const expandAllWithSameID = ref(usr.expandAllWithSameID)

const taskTreeSettings = ref({ 'Incomplete Only': incompleteOnly, 'Expand Task Everywhere It\'s Found': expandAllWithSameID, 'Enable RGB': toggleRGB, 'Reverse Task Order': reverseOrder})

watch(incompleteOnly, () => {
  usr.hideCompleted = incompleteOnly.value
})
watch(expandAllWithSameID, () => {
  Utils.notifySuccess('Coming Soon', 'fas fa-info')
  usr.expandAllWithSameID = expandAllWithSameID.value
})

const style = (task: Task) => ({
  backgroundColor: toggleRGB.value ? task.hashColor() : undefined,
  innerWidth: '100%'
})

const allTasks = computed(() => tr.value.withAll().get())

const layerZero = computed(() => {
  const val = allTasks.value
  .filter(x => (incompleteOnly.value ? !x.completed : true))
  .filter(x => reverseOrder.value ? !x.hasIncompletePostreqs : !x.hasIncompletePrereqs)
  .map(x => x.treeNode(reverseOrder.value, incompleteOnly.value))
  console.debug({ layerZero: val })
  return val
})

// todo: this could be a problem for reactivity
let allTaskNodes = Array.from(layerZero.value)

console.log({ allTaskNodes })

const theTree = ref<QTreeComponent<Task>>()

// type NodeKey = {
//   id: number,
//   key: string
// }

// forgive me
// let queueCollapse: NodeKey[] = []
// const collapseNodesInQueue = () => {
//   queueCollapse = queueCollapse.filter((x) => t.isExpanded(x.key))
//   if(queueCollapse.length === 0) {
//     previousExpanded = expandedNodes.value
//     return
//   }
//   expandedNodes.value = expandedNodes.value.filter((x) => queueCollapse.findIndex((y) => y.key === x) === -1)
//   setTimeout(collapseNodesInQueue, 1)
// }

// i hate that this works
// let queueExpand: NodeKey[] = []
// const expandNodesInQueue = () => {
//   console.debug('expandNodesInQueue')
//   if(typeof t !== 'undefined') {
//     queueExpand = queueExpand.filter((x) => !t.isExpanded(x.key))
//     if(queueExpand.length === 0) {
//       previousExpanded = expandedNodes.value
//       return
//     }
//     const stuckNodes = queueExpand.filter((x) => expandedNodes.value.includes(x.key))
//     if(stuckNodes.length > 0) {
//       stuckNodes.forEach((x) => {
//         if(typeof t === 'undefined') {
//           console.warn('that is kinda messed up. t is undefind now.')
//         }
//         console.debug({ t, 'stuck node needs to be expanded': x })
//         t.setExpanded(x.key, true)
//       })
//     }
//     else {
//       expandedNodes.value.push(...queueExpand.map((x) => x.key))
//     }
//   }
//   setTimeout(expandNodesInQueue, 1000)
// }

const $q = useQuasar()

const openTask = (currentTask: Task) => TDLAPP.openTask(currentTask, $q)

const updateTaskCompletedStatus = (task: Task) => {
  tr.value.update({ id: Utils.hardCheck(task.id), payload: { task }})
}

// const shouldBeExpanded = <T>(x: SimpleTreeNode<T>) => esr.value.isExpanded(x.id)
// const toNodeKey = <T>(x: SimpleTreeNode<T>) => ({ id: x.id, key: x.key })

const childNodeLoader = (getter: λ<details<Task>, SimpleTreeNode<Task>[]>) => (d: details<Task>) => {
  // esrc.setExpanded(d.node.id, true)
  // queueExpand.push(toNodeKey(d.node))
  const childNodes = getter(d)
  console.log({ childNodes })
  d.done(childNodes)
  if(childNodes.length) {
    allTaskNodes.push(...childNodes)
    console.debug({ allTaskNodes })
    if(expandAllWithSameID.value) {
      // queueExpand.push(...childNodes.filter(shouldBeExpanded).map(toNodeKey))
      // console.log({ queueExpand })
    }
  }
  // handleExpandAndCollapse()
}

const prenodes  = (x: details<Task>) => x.node.obj.hardPrereqTreeNodes(reverseOrder.value, incompleteOnly.value)
const postnodes = (x: details<Task>) => x.node.obj.hardPostreqTreeNodes(reverseOrder.value, incompleteOnly.value)
const loadChildren: λ<details<Task>, void> = d => childNodeLoader(reverseOrder.value ? prenodes : postnodes)(d)

// this MUST be set in order for onExpanded to work.
const expandedNodes = ref<string[]>([])

// let previousExpanded: string[] = []

// const onlyInLeftArray = <T>(leftArr: T[], rightArr: T[]) => {
//   const rightSet = new Set(rightArr)
//   return leftArr.filter(x => !rightSet.has(x))
// }

const onExpanded = (list: readonly any[]) => {
  console.debug('onExpanded: ', list)
  // if(!expandAllWithSameID.value) {
  //   console.log('expand all with same id setting is disabled, skipping custom behavior')
  //   console.debug({ previousExpanded, list })
  //   return
  // }
  // const delta = previousExpanded.length - list.length
  // if(delta > 0) {
  //   const diff: string[] = onlyInLeftArray(previousExpanded, list as string[]) // anything no longer in the list of expanded tasks
  //   if(diff.length) {
  //     diff.forEach((key) => esr.value.setKeyExpanded(key, false))
  //     // console.debug({'setToCollapsed': diff})
  //   }
  //   else console.error('wut', {previousExpanded, list})
  // }
  // else if(delta < 0) {
  //   const diff: string[] = onlyInLeftArray(list as string[], previousExpanded) // anything new to the list of expanded tasks
  //   if(diff.length) {
  //     diff.forEach((key) => esr.value.setKeyExpanded(key, true))
  //     // console.debug({'setToExpanded': diff})
  //   }
  //   else console.error('wut', {previousExpanded, list})
  // }
  // // handleExpandAndCollapse()
  // previousExpanded = list as string[]
}

// const esrc = esr.value
// const handleExpandAndCollapse = () => {
//   if(expandAllWithSameID.value) {
//     let shouldBeExpanded
//     allTaskNodes.forEach((x) => {
//       shouldBeExpanded = esrc.isExpanded(x.id)
//       if(t.isExpanded(x.key) !== shouldBeExpanded) {
//         if(shouldBeExpanded) queueExpand.push(toNodeKey(x))
//         else queueCollapse.push(toNodeKey(x))
//       }
//     })
//   }
  
//   if(queueExpand.length   !== 0) expandNodesInQueue()
//   if(queueCollapse.length !== 0) collapseNodesInQueue()
// }

let t: QTreeComponent<Task>

onMounted(() => {
  t = Utils.hardCheck(theTree.value)
  console.log({ 'treeref is legit': t })
  // handleExpandAndCollapse()
})

</script>
