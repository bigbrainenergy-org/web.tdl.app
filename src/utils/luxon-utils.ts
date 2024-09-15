import { Settings } from 'luxon'

export function updateLuxonTimeZone(newTimeZone: string) {
  Settings.defaultZone = newTimeZone
}
