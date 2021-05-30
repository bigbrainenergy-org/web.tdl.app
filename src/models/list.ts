import { Model } from '@vuex-orm/core'
import Task from './task'

export default class List extends Model {
  static entity = 'lists'

  static fields () {
    return {
      id: this.attr(null),
      title: this.attr(''),
      order: this.attr(0),
      tasks: this.hasMany(Task, 'list_id')
    }
  }
}
