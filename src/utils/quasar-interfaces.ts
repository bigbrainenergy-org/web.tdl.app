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
