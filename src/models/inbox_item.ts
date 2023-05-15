import { Model } from 'pinia-orm'
import { IInboxItem } from 'src/components/models'
import { Attr, Str } from 'pinia-orm/dist/decorators'

export default class InboxItem extends Model implements IInboxItem {
  static entity = 'inbox_items'

  @Attr(null) declare id: number
  @Str('') declare title: string
  @Str(null) declare notes: string
}
