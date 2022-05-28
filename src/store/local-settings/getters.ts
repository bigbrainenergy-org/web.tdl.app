import { GetterTree } from 'vuex';
import { StateInterface } from '../index';
import { LocalSettingsStateInterface } from './state';

const getters: GetterTree<LocalSettingsStateInterface, StateInterface> = {
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
  },
};

export default getters;
