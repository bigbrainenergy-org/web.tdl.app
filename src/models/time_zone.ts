import { Model } from 'pinia-orm';
import { TimeZoneInterface } from 'src/components/models';
import { Attr, Str, Num } from 'pinia-orm/dist/decorators'

export default class TimeZone extends Model implements TimeZoneInterface {
  static entity = 'timezones'

  @Attr(null) declare id: number | null
  @Str('') declare name: string
  @Str('') declare value: string
}