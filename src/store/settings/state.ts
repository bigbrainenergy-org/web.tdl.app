import { TimeZone } from '../../components/models'

export interface SettingsStateInterface {
  username: string;
  taskSearch: string;
  timeZone: string;
  timeZones: Array<TimeZone>;
  selectedList: string;
  selectedTags: Array<string>;
  tagsFilter: string;
}

function state(): SettingsStateInterface {
  return {
    username: '',
    taskSearch: '',
    timeZone: '',
    timeZones: [],
    selectedList: 'All Tasks',
    selectedTags: [],
    tagsFilter: 'all'
  }
};

export default state;
