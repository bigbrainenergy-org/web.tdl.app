import { MutationTree } from 'vuex';
import { LocalSettingsStateInterface } from './state';

const mutation: MutationTree<LocalSettingsStateInterface> = {
  setTaskSearch(state, taskSearch: string) {
    state.taskSearch = taskSearch
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
