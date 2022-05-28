import { MutationTree } from 'vuex';
import { UsersStateInterface } from './state';
import { User } from '../../components/models'
import { Settings } from 'luxon'

const mutation: MutationTree<UsersStateInterface> = {
  setUser(state, user: User) {
    state.user = user
    // Also set default time zone for Luxon
    Settings.defaultZone = user.time_zone
  },
}

export default mutation;
