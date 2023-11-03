import { Model } from 'pinia-orm'
import { Attr, Str, Uid } from 'pinia-orm/dist/decorators';

export default class LocalSettings extends Model {
  static entity = 'local-settings'

  @Uid() declare id: number | null
  @Str('') declare taskSearch: string
  @Str('') declare selectedList: string
  @Attr([]) declare selectedTags: Array<string>
  @Str('') declare tagsFilter: string
}