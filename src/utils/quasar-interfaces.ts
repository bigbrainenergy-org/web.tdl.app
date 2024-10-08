export type SimpleTreeNode<T> = {
  id: number
  obj: T
  label: string
  expandable: boolean
  lazy: boolean
  key: string // key is supposedly fine as any but really q-tree needs it to be string, esp for lazy loading.
}
export type details<T> = {
  node: SimpleTreeNode<T>
  key: string
  done: (children: SimpleTreeNode<T>[]) => void
  fail: () => void
}

export interface QTreeComponent<T> {
  nodes: SimpleTreeNode<T>[]
  getExpandedNodes(): SimpleTreeNode<T>[]
  setExpanded(key: string, state: boolean): void
  isExpanded(key: string): boolean
  getNodeByKey(key: string): SimpleTreeNode<T> | undefined
}

// example lazy loader
// const loadPostreqs = (d: details<Task>) => {
//   setTimeout(() => {
//     const postreqs = tr.with('hard_postreqs').where((x) => d.node.value.hard_postreq_ids.includes(x.id)).get()
//     d.done(postreqs.map((x) => {
//       return {
//         key: x.id + '',
//         summary: '',
//         lazy: true,
//         value: x,
//         id: x.id + ''
//     }}))
//   }, 500)
// }

// and template
// <q-tree
// :nodes="layerZeroTasks"
// node-key="id"
// label-key="title"
// dense
// children-key="hard_postreqs"
// @update:expanded="loadPostreqsOfNewExpanded">
//   <template v-slot:default-header="prop">
//     <q-item class="text-primary">
//       <q-item-label @click="openTask(prop.node)">
//         {{ prop.node.title }}
//       </q-item-label>
//     </q-item>
//   </template>
// </q-tree> -->
