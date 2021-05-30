import { MutationTree } from 'vuex';
import { SettingsStateInterface } from './state';
import { TimeZone } from '../../components/models'
import { Settings } from 'luxon'

const mutation: MutationTree<SettingsStateInterface> = {
  setUsername(state, username: string) {
    state.username = username
  },

  setTaskSearch(state, taskSearch: string) {
    state.taskSearch = taskSearch
  },

  setTimeZone(state, timeZone: string) {
    state.timeZone = timeZone
    // Also set default time zone for Luxon
    Settings.defaultZone = timeZone
  },

  setTimeZones(state, timeZones: Array<TimeZone>) {
    state.timeZones = timeZones
  },

  setSelectedList(state, selectedList: string) {
    state.selectedList = selectedList
  },

  setSelectedTags(state, selectedTags: Array<string>) {
    state.selectedTags = selectedTags
  },

  setTagsFilter(state, tagsFilter: string) {
    state.tagsFilter = tagsFilter
  },

  clearTags(state) {
    state.selectedTags = []
  },

  toggleSelectedTag(state, title: string) {
    const index = state.selectedTags.indexOf(title);

    if (index === -1) {
      if (title === 'No Tags') {
        state.selectedTags = [title];
      } else {
        const noTagsIndex = state.selectedTags.indexOf('No Tags');
        if (noTagsIndex !== -1) {
          state.selectedTags.splice(noTagsIndex, 1);
        }
        state.selectedTags.push(title)
      }
    } else {
      state.selectedTags.splice(index, 1);
    }
  }
};

export default mutation;
