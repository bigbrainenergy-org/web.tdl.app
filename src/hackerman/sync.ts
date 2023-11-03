import { useRepo } from 'pinia-orm'
import { ListRepo } from 'src/stores/lists/list'
import { TaskRepo } from 'src/stores/tasks/task'
import { TimeZoneRepo } from 'src/stores/time-zones/time-zone'
import { UserRepo } from 'src/stores/users/user'
import { Utils } from 'src/util'

export async function syncWithBackend() {
  await useRepo(UserRepo).fetchUser().
  catch(Utils.handleError('Failed to fetch user metadata'))
  await useRepo(TaskRepo).fetch().
  catch(Utils.handleError('Failed to fetch tasks'))
  await useRepo(ListRepo).fetch().
  catch(Utils.handleError('Failed to fetch lists'))
  await useRepo(TimeZoneRepo).fetch().
  catch(Utils.handleError('Failed to fetch time zones'))
}
