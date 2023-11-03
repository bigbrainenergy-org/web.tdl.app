export type SimpleTreeNode<T> = {
  id: number,
  obj: T,
  label: string
  expandable: boolean,
  lazy: boolean,
  key: string
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
}

// example lazy loader
// const loadPostreqs = (d: details<Task>) => {
//   console.debug(`load postreqs of ${d.node.value.title}`)
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