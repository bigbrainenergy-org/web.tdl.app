import { Model } from '@vuex-orm/core'
import NextAction from './next_action'

export default class Context extends Model {
  static entity = 'contexts'

  static fields () {
    return {
      id: this.attr(null),
      title: this.attr(''),
      color: this.attr(''),
      icon: this.attr(''),
      order: this.attr(0),
      next_actions: this.hasMany(NextAction, 'context_id'),
    }
  }
}
