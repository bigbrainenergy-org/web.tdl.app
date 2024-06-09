import { Model } from 'pinia-orm'

export default interface iRecord extends Model {
  // todo: enforce id as primaryKey
  id: number | null
}

export interface iOptions {
  id: number
  payload: object
}
