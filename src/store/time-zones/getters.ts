import { GetterTree } from 'vuex';
import { StateInterface } from '../index';
import { TimeZonesStateInterface } from './state';

const getters: GetterTree<TimeZonesStateInterface, StateInterface> = {
  timeZones (state) {
    return state.timeZones
  },
};

export default getters;
