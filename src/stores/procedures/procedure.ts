import { Model, useRepo } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Num, Str, Attr, HasManyBy } from 'pinia-orm/dist/decorators'
import { Task, TaskRepo } from '../tasks/task'
import GenericRepo from '../generics/generic-repo'
import { AxiosResponse } from 'axios'
import { TaskCache } from '../performance/task-go-fast'
import { Utils } from 'src/util'
import { useAllTasksStore } from '../performance/all-tasks'
import { useLayerZeroStore } from '../performance/layer-zero'

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
  static entity = 'procedures'

  @Num(-1) declare id: number
  @Str('') declare title: string
  @Str('') declare color: string
  @Str('') declare icon: string
  @Attr([]) declare task_ids: number[]

  @HasManyBy(() => Task, 'task_ids') declare tasks: Task[]

  static piniaOptions = {
    persist: true
  }

  grabTasks(): Task[] {
    const tasks = useRepo(TaskRepo)
      .where((x) => x.procedure_ids.includes(this.id))
      .get()
    return tasks
  }
}

export class ProcedureRepo extends GenericRepo<
  CreateProcedureOptions,
  UpdateProcedureOptions,
  Procedure
> {
  use = Procedure
  apidir = Procedure.entity

  resetProcedure = (id: number) => {
    const url = `/${this.apidir}/reset/${id}`
    console.log({ url })
    return this.api()
      .post(url, undefined, this.commonHeader())
      .then(() => {
        const tmp = Utils.hardCheck(this.withAll().find(id))
        tmp.grabTasks().forEach((x) => {
          console.log(`setting ${x.title} to INCOMPLETE`)
          useRepo(TaskRepo).save({ id: x.id, completed: false })
          x.completed = false
          TaskCache.update(x)
          console.log(`layer zero length: ${useLayerZeroStore().typed.length}`)
        })
        console.debug({ tasks: tmp.grabTasks() })
        return tmp
      }, Utils.handleError('Error restarting procedure.'))
  }
}
