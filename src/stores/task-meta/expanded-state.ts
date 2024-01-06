import { Model, Repository } from 'pinia-orm'
import { Num, Bool } from 'pinia-orm/dist/decorators'

export default class ExpandedState extends Model {
  static entity = 'expanded-state'

  @Num(-1) declare id: number
  @Bool(false) declare expanded: boolean

  static piniaOptions = {
    persist: true
  }
}

export class ExpandedStateRepo extends Repository<ExpandedState> {
  use = ExpandedState

  getByTaskID = (task_id: number) => {
    return this.find(task_id) ?? this.save({ id: task_id, expanded: false })
  }

  isExpanded = (task_id: number) => {
    return this.getByTaskID(task_id).expanded
  }

  setExpanded = (task_id: number, expanded = true) => {
    this.save({ id: task_id, expanded })
  }

  setKeyExpanded = (task_node_key: string, expanded = true) => {
    const id = parseInt(task_node_key.slice(0, task_node_key.indexOf('.')))
    this.setExpanded(id, expanded)
  }
}