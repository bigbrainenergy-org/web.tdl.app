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
  static override entity = 'time-zones'
  static override primaryKey = 'value'
  @Uid() declare id: number
  @Str('') declare name: string
  @Str('') declare value: string
  static override piniaOptions = {
    persist: true
  }
}

export class TimeZoneRepo extends GenericRepo<
  CreateTimeZoneOptions,
  UpdateTimeZoneOptions,
  TimeZone
> {
  override use = TimeZone
  override apidir = TimeZone.entity
}
