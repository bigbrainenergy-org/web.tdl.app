import { MutationTree } from 'vuex';
import { TimeZonesStateInterface } from './state';
import { TimeZone } from '../../components/models'

const mutation: MutationTree<TimeZonesStateInterface> = {
  setTimeZones(state, timeZones: Array<TimeZone>) {
    state.timeZones = timeZones
  },
};

export default mutation;
