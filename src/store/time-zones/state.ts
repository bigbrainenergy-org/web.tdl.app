import { TimeZone } from '../../components/models'

export interface TimeZonesStateInterface {
  timeZones: Array<TimeZone>;
}

function state(): TimeZonesStateInterface {
  return {
    timeZones: [],
  }
};

export default state;
