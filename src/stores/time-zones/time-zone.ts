import { Model } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Str, Uid } from 'pinia-orm/dist/decorators'
import GenericRepo from '../generics/generic-repo'

export interface CreateTimeZoneOptions {
  name: string
  value: string
}

export interface UpdateTimeZoneOptions extends iOptions {
  id: number
  payload: {
    timezone: {
      name?: string
      value?: string
    }
  }
}

export class TimeZone extends Model implements iRecord {
  static entity = 'time-zones'
  static primaryKey = 'value'
  @Uid() declare id: number
  @Str('') declare name: string
  @Str('') declare value: string
  static piniaOptions = {
    persist: true
  }
}

export class TimeZoneRepo extends GenericRepo<
  CreateTimeZoneOptions,
  UpdateTimeZoneOptions,
  TimeZone
> {
  use = TimeZone
  apidir = TimeZone.entity
}
