import { Model } from 'pinia-orm'
import type { iOptions } from '../generics/i-record'
import type iRecord from '../generics/i-record'
import { Num, Str, Attr } from 'pinia-orm/dist/decorators'
import GenericRepo from '../generics/generic-repo'
import { useTaskStore } from 'src/stores/tasks/task-store'
import type { Task } from 'src/stores/tasks/task-model'
import { hardCheck } from 'src/utils/type-utils'
import { handleError } from 'src/utils/notification-utils'

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

  grabTasks(): Task[] {
    return useTaskStore().array.filter((x) => x.procedure_ids?.includes(this.id))
  }

  get tasks() {
    const ts = useTaskStore()
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
    return this.api()
      .post(url, undefined, this.commonHeader())
      .then(() => {
        const tmp = hardCheck(this.find(id))
        const tasks = tmp.grabTasks()
        for (let i = 0; i < tasks.length; i++) {
          const ti = tasks[i]!
          ti.completed = false
        }
        return tmp
      }, handleError('Error restarting procedure.'))
  }
}
