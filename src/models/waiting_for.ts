import { Model } from '@vuex-orm/core'

export default class WaitingFor extends Model {
  static entity = 'waiting_fors'

  static fields () {
    return {
      id: this.attr(null),
      title: this.attr(''),
      notes: this.attr('')
    }
  }
}
