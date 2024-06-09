import { Model } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Attr, BelongsTo } from 'pinia-orm/dist/decorators'
import GenericRepo from '../generics/generic-repo'
import { User } from '../users/user'

export interface CreateStatusOptions {
  title: string
  user_id: number
  // todo: randomize and save a color on backend if not provided
  color?: string
  // todo: sensible defaults
  icon?: string
}

export interface UpdateStatusOptions extends iOptions {
  id: number
  payload: {
    status: {
      title?: string
      user_id?: number | null
      color?: string
      icon?: string
    }
  }
}

export class Status extends Model implements iRecord {
  static entity = 'statuses'

  // todo: don't just use attr
  @Attr(null) declare id: number | null
  @Attr('') declare title: string
  @Attr(null) declare user_id: number | null
  @Attr('') declare color: string
  @Attr('') declare icon: string

  @BelongsTo(() => User, 'user_id') declare user: User | null
}

export class StatusRepo extends GenericRepo<
  CreateStatusOptions,
  UpdateStatusOptions,
  Status
> {
  use = Status
  apidir = Status.entity
}
