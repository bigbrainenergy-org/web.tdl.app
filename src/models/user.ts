import { Model } from 'pinia-orm';

export default class User extends Model {
  static entity = 'users'

  static fields () {
    return {
      id: this.attr(null),
      timeZone: this.attr('')
    }
  }
}