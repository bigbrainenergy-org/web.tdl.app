import { Settings } from 'luxon'
import { useRepo } from 'pinia-orm'
import { ListRepo } from 'src/stores/lists/list'
import { TaskCache } from 'src/stores/performance/task-go-fast'
import { TaskRepo } from 'src/stores/tasks/task'
import { TimeZoneRepo } from 'src/stores/time-zones/time-zone'
import { UserRepo } from 'src/stores/users/user'
import { Utils } from 'src/util'

interface verySpecial {
  modelname: string
  repo: any
}

export async function syncWithBackend(): Promise<number> {
  let tries = 3
  const queue: verySpecial[] = [
    {
      modelname: 'User',
      repo: UserRepo
    },
    {
      modelname: 'Task',
      repo: TaskRepo
    },
    {
      modelname: 'List',
      repo: ListRepo
    },
    {
      modelname: 'Time Zone',
      repo: TimeZoneRepo
    }
  ]

  while (queue.length && tries > 0) {
    await useRepo(queue[queue.length - 1].repo)
      .fetch()
      .then(queue.pop())
      .catch(() => {
        Utils.handleError(
          `Failed to fetch from repo ${queue[0].repo.apidir}; MAKING ${tries} MORE ATTEMPTS`
        )
        tries--
      })
  }
  if (queue.length === 0) {
    // this is the good
    const currentUser = useRepo(UserRepo).getUser()
    if (currentUser === null || typeof currentUser === 'undefined') return 2
    console.log({ user: currentUser })
    Utils.updateLuxonTimeZone(currentUser.time_zone)
    console.log({
      setting: Settings.defaultZone,
      currentUserSetting: currentUser.time_zone,
      obj: currentUser.timeZoneObj
    })
    TaskCache.regenerate()
    return 0
  }
  return 1
}
