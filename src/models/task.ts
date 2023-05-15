import { Model } from 'pinia-orm'
import List from './list'
import Tag from './tag'

export default class Task extends Model {
  static entity = 'tasks'

  static fields () {
    return {
      id: this.attr(null),
      list_id: this.attr(null),
      list: this.belongsTo(List, 'list_id'),
      title: this.attr(''),
      order: this.attr(0),
      notes: this.attr(''),
      completed_at: this.attr(''),
      deadline_at: this.attr(''),
      prioritize_at: this.attr(''),
      remind_me_at: this.attr(''),
      review_at: this.attr(''),
      pre_ids: this.attr([]),
      post_ids: this.attr([]),
      tag_ids: this.attr([]),
      prereqs: this.hasManyBy(Task, 'pre_ids'),
      postreqs: this.hasManyBy(Task, 'post_ids'),
      tags: this.hasManyBy(Tag, 'tag_ids'),
    }
  }
}
