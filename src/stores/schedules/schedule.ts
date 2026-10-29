import { Model } from 'pinia-orm'
import type { iOptions } from '../generics/i-record'
import type iRecord from '../generics/i-record'
import { Attr, Bool, Num, Str } from 'pinia-orm/dist/decorators'
import GenericRepo from '../generics/generic-repo'

export type DayOfWeek = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export const DAYS_OF_WEEK: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export interface ScheduleBlock {
  day_of_week: DayOfWeek
  start: string // HH:mm format
  end: string   // HH:mm format
}

export interface CreateScheduleOptions {
  title: string
  default?: boolean
  blocks: ScheduleBlock[]
}

export interface UpdateScheduleOptions extends iOptions {
  id: number
  payload: {
    schedule: {
      title?: string
      default?: boolean
      blocks?: ScheduleBlock[]
    }
  }
}

export class Schedule extends Model implements iRecord {
  static override entity = 'schedules'

  @Num(-1) declare id: number
  @Str('') declare title: string
  @Bool(false) declare default: boolean
  @Attr([]) declare blocks: ScheduleBlock[]

  static override piniaOptions = {
    persist: true
  }

  /**
   * Check if this schedule has an active block at the given day and time.
   * @param day - day of the week
   * @param timeHHmm - time in HH:mm format
   */
  isActiveAt(day: DayOfWeek, timeHHmm: string): boolean {
    return this.blocks.some(
      (b) => b.day_of_week === day && b.start <= timeHHmm && timeHHmm < b.end
    )
  }
}

export class ScheduleRepo extends GenericRepo<
  CreateScheduleOptions,
  UpdateScheduleOptions,
  Schedule
> {
  override use = Schedule
  override apidir = Schedule.entity
}
