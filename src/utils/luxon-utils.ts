import { Settings, DateTime } from 'luxon'

export function updateLuxonTimeZone(newTimeZone: string) {
  Settings.defaultZone = newTimeZone
}

export function datetimeToString(datetime: string) {
  const date = DateTime.fromISO(datetime).toUTC()
  const today = DateTime.now().toUTC()
  console.log(date.startOf('day'))
  console.log(today.startOf('day'))
  console.log(date.startOf('day') === today.startOf('day'))
  if(date.startOf('day') === today.startOf('day')) {
    return 'Today'
  } else {
    return date.toFormat('MMM d')
  }
}
