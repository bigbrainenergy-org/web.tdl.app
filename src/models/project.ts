import { Model } from 'pinia-orm'
import NextAction from './next_action'

export default class Project extends Model {
  static entity = 'projects'

  static fields () {
    return {
      id: this.attr(null),
      title: this.attr(''),
      notes: this.attr(''),
      order: this.attr(0),
      next_actions: this.hasMany(NextAction, 'project_id'),
      superproject_ids: this.attr([]),
      superprojects: this.hasManyBy(Project, 'superproject_ids'),
      subproject_ids: this.attr([]),
      subprojects: this.hasManyBy(Project, 'subproject_ids'),
    }
  }
}
