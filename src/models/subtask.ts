import { Model } from 'pinia-orm'
import NextAction from './next_action'

export default class Subtask extends Model {
  static entity = 'subtasks'

  static fields () {
    return {
      id: this.attr(null),
      next_action_id: this.attr(null),
      next_action: this.belongsTo(NextAction, 'next_action_id'),
      title: this.attr(''),
      order: this.attr(0),
      completed: this.attr(false),
    }
  }
}
