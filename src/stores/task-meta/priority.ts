import { Model, useRepo } from 'pinia-orm'
import { Bool, Num, BelongsTo } from 'pinia-orm/dist/decorators'
import { Task, TaskRepo } from '../tasks/task'

export default class Priority extends Model {
  static entity = 'priority'

  @Num(-1) declare id: number
  @Num(1) declare priority: boolean
  @Bool(true) declare needs_recalc: boolean

  @BelongsTo(() => Task, 'id') declare task: Task | null

  static piniaOptions = {
    persist: true
  }

  rerun = () => {
    this.needs_recalc = true
    const tr = useRepo(TaskRepo)
    const t = tr.withAllRecursive().find(this.id)
    if (t === null)
      throw new Error('priority record does not match any task record')
    t.hard_prereqs.forEach((x) => x.rerun())
  }
}
