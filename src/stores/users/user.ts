import { Model } from 'pinia-orm'
import iRecord, { iOptions } from '../generics/i-record'
import { Attr, BelongsTo, Str } from 'pinia-orm/dist/decorators'
import GenericRepo from '../generics/generic-repo'
import { useAuthenticationStore } from '../authentication/pinia-authentication'
import { TimeZone } from '../time-zones/time-zone'
import { Utils } from 'src/util'
import { useAxiosStore } from '../axios-store'

export interface CreateUserOptions {
  time_zone: string
}

export interface UpdateUserOptions extends iOptions {
  id: number
  payload: {
    user: {
      time_zone?: string
      username?: string
    }
  }
}

export class User extends Model implements iRecord {
  static override entity = 'users'
  // todo: correct decorator type for this and other models
  @Attr(null) declare id: number | null
  @Attr('') declare time_zone: string
  @Str('') declare username: string

  @BelongsTo(() => TimeZone, 'time_zone') declare timeZoneObj: TimeZone | null

  static override piniaOptions = {
    persist: true
  }
}

type passOptions = { current_password: string; password: string }
export class UserRepo extends GenericRepo<CreateUserOptions, UpdateUserOptions, User> {
  override use = User
  override apidir = User.entity

  override fetch = async (): Promise<void> => {
    const userId = useAuthenticationStore().userId
    await this.getId(userId)
  }

  fetchUser = this.fetch

  getUser = () => {
    const userId = useAuthenticationStore().userId
    const user = this.withAll().find(userId)
    return user
  }

  changePassword = async (options: passOptions) => {
    const aust = useAuthenticationStore()
    const userId = aust.userId
    const api = useAxiosStore().axios()
    await api
      .patch(
        `/${this.apidir}/${userId}/change-password`,
        {
          user: options
        },
        {
          headers: { Authorization: aust.bearerToken }
        }
      )
      .then(
        Utils.handleSuccess('Password has been changed'),
        Utils.handleError('Failed to change user password')
      )
  }

  changeTimezone = async (newTimeZone: TimeZone) => {
    const aust = useAuthenticationStore()
    const userId = aust.userId
    await this.update({
      id: userId,
      payload: {
        user: {
          time_zone: newTimeZone.value
        }
      }
    }).then((response: any) => {
      Utils.updateLuxonTimeZone(newTimeZone.value)
    }, Utils.handleError('failed to update timezone'))
  }
}
