import { useRepo } from 'pinia-orm'
import { ListRepo } from 'src/stores/lists/list'
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
    }]
  
    while(queue.length && tries > 0) {
      await useRepo(queue[queue.length - 1].repo).fetch()
      .then(queue.pop())
      .catch(() => {
        Utils.handleError(`Failed to fetch from repo ${queue[0].repo.apidir}; MAKING ${tries} MORE ATTEMPTS`)
        tries--
      })
    }
    if(queue.length === 0) {
      return 0
    }
  return 1
}
