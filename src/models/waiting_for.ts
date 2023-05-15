import { Model } from 'pinia-orm'
import { IWaitingFor } from 'src/components/models'

export default class WaitingFor extends Model implements IWaitingFor {
  id!: number
  title!: string
  notes?: string | undefined
  static entity = 'waiting_fors'

  static fields () {
    return {
      id: this.attr(null),
      title: this.attr(''),
      notes: this.attr('')
    }
  }
}
