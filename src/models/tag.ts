import { Model } from 'pinia-orm'
import Task from './task'

export default class Tag extends Model {
  static entity = 'tags'

  static fields () {
    return {
      id: this.attr(null),
      title: this.attr(''),
      order: this.attr(0),
      color: this.attr('')
    }
  }
}
