import { Model } from 'pinia-orm';
import iRecord, { iOptions } from '../generics/i-record';
import { Attr, BelongsTo, Str } from 'pinia-orm/dist/decorators';
import GenericRepo from '../generics/generic-repo';
import { useAuthenticationStore } from '../authentication/pinia-authentication'
import { TimeZone } from '../time-zones/time-zone'
import { Utils } from 'src/util'
import { useAxiosStore } from '../axios-store'

export interface CreateUserOptions {
  timeZone: string;
}

export interface UpdateUserOptions extends iOptions {
  id: number,
  payload: {
    user: {
      timeZone?: string
      username?: string
    }
  }
}

export class User extends Model implements iRecord {
  static entity = 'users';
  // todo: correct decorator type for this and other models
  @Attr(null) declare id: number | null;
  @Attr('') declare timeZone: string;
  @Str('') declare username: string

  @BelongsTo(() => TimeZone, 'timeZone') declare timeZoneObj: TimeZone | null
}

type passOptions = { current_password: string; password: string }
export class UserRepo extends GenericRepo<CreateUserOptions, UpdateUserOptions, User> {
  use = User
  apidir = User.entity;

  fetchUser = async (): Promise<void> => {
    const userId = useAuthenticationStore().userId
    await this.getId(userId)
  }

  getUser = () => {
    return this.find(useAuthenticationStore().userId)
  }

  changePassword = async (options: passOptions) => {
    const aust = useAuthenticationStore()
    const userId = aust.userId
    const api = useAxiosStore().axios()
    await api.patch(`/${this.apidir}/${userId}/change-password`,
      {
        user: options,
      },{
        headers: { Authorization: aust.bearerToken }
      }
    ).then(
      Utils.handleSuccess('Password has been changed'),
      Utils.handleError('Failed to change user password')
    )
  }
}
