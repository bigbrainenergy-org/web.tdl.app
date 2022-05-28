export interface LocalSettingsStateInterface {
  taskSearch: string;
  selectedList: string;
  selectedTags: Array<string>;
  tagsFilter: string;
}

function state(): LocalSettingsStateInterface {
  return {
    taskSearch: '',
    selectedList: 'All Tasks',
    selectedTags: [],
    tagsFilter: 'all'
  }
};

export default state;
