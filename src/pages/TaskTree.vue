<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="col-grow">
        <q-card
          class="full-height q-pl-md text-primary"
          style="background-color: #1d1d1df6"
        >
          <q-card-actions>
            <SettingsButton
              v-model:settings="taskTreeSettings"
              name="Task Tree Settings"
            />
            <q-space />
            <q-item-label>{{ layerZero.length }} tasks</q-item-label>
            <q-space />
            <q-btn
              icon="fa-solid fa-search"
              class="text-primary"
              @click="openSearchDialog"
            />
          </q-card-actions>
          <q-tree
            v-if="reverseOrder"
            ref="theReverseTree"
            v-model:expanded="useRawExpandedStateStore().expandedNodesReverse"
            :nodes="layerZero"
            node-key="key"
            dense
            class="text-primary"
            @lazy-load="loadChildren"
            @update:expanded="onExpanded"
          >
            <template #default-header="prop">
              <q-item class="text-primary" :style="style(prop.node.obj)">
                <q-checkbox
                  v-model:model-value="prop.node.obj.completed"
                  color="primary"
                  keep-color
                  @update:model-value="updateTaskCompletedStatus(prop.node.obj)"
                ></q-checkbox>
                <q-item-label @click.stop="openTask(prop.node.obj)">
                  {{ prop.node.label }}
                </q-item-label>
              </q-item>
            </template>
          </q-tree>
          <q-tree
            v-else
            ref="theTree"
            v-model:expanded="useRawExpandedStateStore().expandedNodesRegular"
            :nodes="layerZero"
            node-key="key"
            dense
            class="text-primary"
            @lazy-load="loadChildren"
            @update:expanded="onExpanded"
          >
            <template #default-header="prop">
              <q-item class="text-primary" :style="style(prop.node.obj)">
                <q-checkbox
                  v-model:model-value="prop.node.obj.completed"
                  color="primary"
                  keep-color
                  @update:model-value="updateTaskCompletedStatus(prop.node.obj)"
                ></q-checkbox>
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { details, QTreeComponent, SimpleTreeNode } from 'src/quasar-interfaces'
import { Utils } from 'src/util'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
// import { ExpandedStateRepo } from 'src/stores/task-meta/expanded-state'
import SettingsButton from 'src/components/SettingsButton.vue'
import { NodeKey, λ } from 'src/types'
import { TDLAPP } from 'src/TDLAPP'
import { useRawExpandedStateStore } from 'src/stores/task-meta/raw-expanded-state-store'
import { storeToRefs } from 'pinia'

const tr = computed(() => useRepo(TaskRepo))
// const esr = computed(() => useRepo(ExpandedStateRepo))
const usr = useLocalSettingsStore()

const toggleRGB = ref(false)

const reverseOrder = ref(usr.reverseTreeView)
const incompleteOnly = ref(usr.hideCompleted)
const expandAllWithSameID = ref(usr.expandAllWithSameID)

const taskTreeSettings = ref({
  'Incomplete Only': incompleteOnly,
  "Expand Task Everywhere It's Found": expandAllWithSameID,
  'Enable RGB': toggleRGB,
  'Reverse Task Order': reverseOrder
})

watch(incompleteOnly, () => {
  usr.hideCompleted = incompleteOnly.value
})

watch(expandAllWithSameID, () => {
  Utils.notifySuccess('Coming Soon', 'fas fa-info')
  usr.expandAllWithSameID = expandAllWithSameID.value
})

watch(reverseOrder, () => {
  console.warn(
    `REVERSE MODE IS NOW ${reverseOrder.value ? 'ENABLED' : 'DISABLED'}`
  )
  usr.reverseTreeView = reverseOrder.value
  clearTimeout(expanderTimer)
  initializeQueues()
})

const expanded = ref(useRawExpandedStateStore().expandedNodesRegular)
watch(expanded, () => {
  console.log({ expanded })
})

const expandedReverse = ref(useRawExpandedStateStore().expandedNodesReverse)
watch(expandedReverse, () => {
  console.log({ expandedReverse })
})

const style = (task: Task) => ({
  backgroundColor: toggleRGB.value ? task.hashColor() : undefined,
  innerWidth: '100%'
})

const allTasks = computed(() => tr.value.withAll().get())

const layerZero = computed(() =>
  allTasks.value
    .filter((x) => (incompleteOnly.value ? !x.completed : true))
    .filter((x) =>
      reverseOrder.value ? !x.hasIncompletePostreqs : !x.hasIncompletePrereqs
    )
    .map((x) => x.treeNode(reverseOrder.value, incompleteOnly.value))
)

// todo: this could be a problem for reactivity
let allTaskNodes = Array.from(layerZero.value)

// console.log({ allTaskNodes })

const theTree = ref<QTreeComponent<Task> | undefined>()
const theReverseTree = ref<QTreeComponent<Task> | undefined>()

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
let queueExpand: NodeKey[] = []
let expanderTimer: NodeJS.Timeout | number
let busy = false
type msgQueue = {
  notFound: number
  lazySkipped: string[]
  triedToExpand: string[]
}

const t = computed(() =>
  reverseOrder.value ? theReverseTree.value : theTree.value
)

const expandNodesInQueue = (newCall = false) => {
  if (newCall && busy) {
    // console.warn('expansion flagged as busy. skipping.')
    return
  }
  busy = true
  let msgqueue: msgQueue = { notFound: 0, lazySkipped: [], triedToExpand: [] }
  // console.debug('expandNodesInQueue')

  let didWork = t.value === null || typeof t.value === 'undefined'
  if (!didWork) {
    queueExpand = queueExpand.filter((x) => !t.value?.isExpanded(x.key))
    // console.debug({ 'in queue and not expanded': queueExpand, 'length': queueExpand.length })
    let shouldBeExpanded = NodeKey.fromKeys(
      (reverseOrder.value
        ? useRawExpandedStateStore().expandedNodesReverse
        : useRawExpandedStateStore().expandedNodesRegular
      ).filter((x) => !t.value?.isExpanded(x))
    )
    // console.debug({ 'in expanded nodes store and not expanded': shouldBeExpanded, 'length': shouldBeExpanded.length })
    queueExpand = Utils.combineArrays(queueExpand, shouldBeExpanded)
    // console.debug({ 'combined': queueExpand, 'length': queueExpand.length })
    if (queueExpand.length === 0) {
      console.warn('ALL DONE')
      busy = false
      clearTimeout(expanderTimer)
      //       previousExpanded = expandedNodes.value
      return
    }
    // const stuckNodes = queueExpand.filter((x) => expandedNodes.value.includes(x.key))
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

    let tmpQueue = Array.from(queueExpand)
    let tmp
    while (tmpQueue.length) {
      tmp = tmpQueue.pop()
      if (typeof tmp === 'undefined') {
        msgqueue.notFound++
        continue
      } else if (typeof t.value?.getNodeByKey(tmp.key) === 'undefined') {
        msgqueue.lazySkipped.push(tmp.key)
        Utils.arrayDelete(queueExpand, tmp)
        continue
      } else {
        msgqueue.triedToExpand.push(tmp.key)
        t.value.setExpanded(tmp.key, true)
        didWork = true
      }
    }
  }
  console.debug(msgqueue)
  // console.debug({ treeref: t.value })
  if (didWork) expanderTimer = setTimeout(expandNodesInQueue, 2)
  else busy = false
}

const $q = useQuasar()

const openTask = (currentTask: Task) => {
  TDLAPP.openTask(currentTask)
    .onDismiss(() => initializeQueues())
    .onCancel(() => initializeQueues())
    .onOk(() => initializeQueues())
}

const updateTaskCompletedStatus = (task: Task) => {
  tr.value.updateAndCache({ id: task.id, payload: { task } })
  if (incompleteOnly.value) useRawExpandedStateStore().forgetTask(task.id)
}

const rawExpandedStateStore = useRawExpandedStateStore()
const { hasKey } = storeToRefs(rawExpandedStateStore)

// const shouldBeExpanded = <T>(x: SimpleTreeNode<T>) => esr.value.isExpanded(x.id)
const toNodeKey = <T>(x: SimpleTreeNode<T>) => ({ id: x.id, key: x.key })

const childNodeLoader =
  (getter: λ<details<Task>, SimpleTreeNode<Task>[]>) => (d: details<Task>) => {
    // esrc.setExpanded(d.node.id, true)
    queueExpand.push(toNodeKey(d.node))
    const childNodes = getter(d)
    d.done(childNodes)
    if (childNodes.length) {
      allTaskNodes.push(...childNodes)
      // approach A
      // queueExpand.push(...childNodes.filter(x => hasKey.value(x.key, reverseOrder.value)).map(toNodeKey))
      // approach B
      childNodes
        .filter((x) => hasKey.value(x.key, reverseOrder.value))
        .map((x) => x.key)
        .forEach((x) => t.value?.setExpanded(x, true))
      if (expandAllWithSameID.value) {
        // queueExpand.push(...childNodes.filter(shouldBeExpanded).map(toNodeKey))
        // console.log({ queueExpand })
      }
    }
    console.log('calling handleExpandAndCollapse from childNodeLoader')
    handleExpandAndCollapse()
  }

const prenodes = (x: details<Task>) => {
  return x.node.obj.hardPrereqTreeNodes(
    reverseOrder.value,
    incompleteOnly.value,
    x.node.key
  )
}
const postnodes = (x: details<Task>) => {
  return x.node.obj.hardPostreqTreeNodes(
    reverseOrder.value,
    incompleteOnly.value,
    x.node.key
  )
}
const loadChildren: λ<details<Task>, void> = (d) =>
  childNodeLoader(reverseOrder.value ? prenodes : postnodes)(d)

// let previousExpanded: string[] = []

const onExpanded = (list: readonly any[]) => {
  // console.debug('onExpanded: ', list)
  // if(!expandAllWithSameID.value) {
  //   console.log('expand all with same id setting is disabled, skipping custom behavior')
  //   console.debug({ previousExpanded, list })
  //   return
  // }
  // const delta = previousExpanded.length - list.length
  // if(delta > 0) {
  //   const diff: string[] = onlyInLeftArray(previousExpanded, list as string[]) // anything no longer in the list of expanded tasks
  //   if(diff.length) {
  //     diff.forEach((key) =let> esr.value.setKeyExpanded(key, false))
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
const handleExpandAndCollapse = () => {
  console.log('handleExpandAndCollapse')
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

  if (queueExpand.length !== 0) expandNodesInQueue(true)
  //   if(queueCollapse.length !== 0) collapseNodesInQueue()
}

const initializeQueues = () => {
  console.warn('INITIALIZING QUEUES AND EXPANDING NODES')
  if (reverseOrder.value)
    queueExpand = useRawExpandedStateStore().expandedNodesReverse.map((x) =>
      NodeKey.fromKey(x)
    )
  else
    queueExpand = useRawExpandedStateStore().expandedNodesRegular.map((x) =>
      NodeKey.fromKey(x)
    )
  handleExpandAndCollapse()
}

onMounted(() => {
  console.log('onMounted')
  initializeQueues()
})

// onUnmounted(() => {
//   console.log('onUnmounted')
//   clearTimeout(expanderTimer)
//   queueExpand = []
// })

// onDeactivated(() => {
//   console.log('onDeactivated')
//   clearTimeout(expanderTimer)
//   queueExpand = []
// })
const openSearchDialog = () => TDLAPP.searchDialog()
</script>
