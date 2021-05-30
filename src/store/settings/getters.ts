import { GetterTree } from 'vuex';
import { StateInterface } from '../index';
import { SettingsStateInterface } from './state';

const getters: GetterTree<SettingsStateInterface, StateInterface> = {
  username (state) {
    return state.username;
  },

  timeZone (state) {
    return state.timeZone;
  },

  timeZones (state) {
    return state.timeZones;
  },

  selectedList (state) {
    return state.selectedList;
  },

  selectedTags (state) {
    return state.selectedTags;
  },

  tagsFilter (state) {
    return state.tagsFilter;
  },

  taskSearch (state) {
    return state.taskSearch;
  }
};

export default getters;
