import { Model } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Num, Str, Attr } from 'pinia-orm/dist/decorators'
import GenericRepo from '../generics/generic-repo'
import { Utils } from 'src/util'
import { T2, useTasksStore } from '../taskNoORM'

export interface CreateProcedureOptions {
  title: string
  color: string
  icon: string
  task_ids?: number[]
}

export interface AllOptionalProcedureProperties {
  title?: string
  color?: string
  icon?: string
  task_ids?: number[]
}

export interface UpdateProcedureOptions extends iOptions {
  id: number
  payload: {
    procedure: AllOptionalProcedureProperties
  }
}

export class Procedure extends Model implements iRecord {
  static override entity = 'procedures'

  @Num(-1) declare id: number
  @Str('') declare title: string
  @Str('') declare color: string
  @Str('') declare icon: string
  @Attr([]) declare task_ids: number[]

  // @HasManyBy(() => Task, 'task_ids') declare tasks: Task[]

  static override piniaOptions = {
    persist: true
  }

  grabTasks(): T2[] {
    const tasks = (useTasksStore().array as T2[]).filter((x) => x.procedure_ids?.includes(this.id))
    return tasks
  }

  get tasks() {
    const ts = useTasksStore()
    return this.task_ids.map((x) => ts.hardGet(x))
  }
}

export class ProcedureRepo extends GenericRepo<
  CreateProcedureOptions,
  UpdateProcedureOptions,
  Procedure
> {
  override use = Procedure
  override apidir = Procedure.entity

  resetProcedure = (id: number) => {
    const url = `/${this.apidir}/reset/${id}`
    console.log({ url })
    return this.api()
      .post(url, undefined, this.commonHeader())
      .then(() => {
        const tmp = Utils.hardCheck(this.withAll().find(id))
        const tasks = tmp.grabTasks()
        tasks.forEach((x) => (x.completed = false))
        useTasksStore().update(tasks)
        return tmp
      }, Utils.handleError('Error restarting procedure.'))
  }
}
