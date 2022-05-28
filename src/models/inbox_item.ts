import { Model } from '@vuex-orm/core'

export default class InboxItem extends Model {
  static entity = 'inbox_items'

  static fields () {
    return {
      id: this.attr(null),
      title: this.attr(''),
      notes: this.attr('')
    }
  }
}
