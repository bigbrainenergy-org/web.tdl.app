import { Model } from 'pinia-orm'
import Project from './project'
import Context from './context'

export default class NextAction extends Model {
  static entity = 'next_actions'

  static fields () {
    return {
      id: this.attr(null),
      project_id: this.attr(null),
      context_id: this.attr(null),
      project: this.belongsTo(Project, 'project_id'),
      context: this.belongsTo(Context, 'context_id'),
      title: this.attr(''),
      notes: this.attr(''),
      order: this.attr(0),
      completed: this.attr(false),
      remind_me_at: this.attr(''),
      mental_energy_required: this.attr(0),
      physical_energy_required: this.attr(0),
      hard_prereq_ids: this.attr([]),
      hard_postreq_ids: this.attr([]),
      hard_prereqs: this.hasManyBy(NextAction, 'hard_prereq_ids'),
      hard_postreqs: this.hasManyBy(NextAction, 'hard_postreq_ids'),
    }
  }
}
