import { Repository } from 'pinia-orm'
import iRecord, { iOptions } from './i-record'
import { useAuthenticationStore } from '../authentication/pinia-authentication'
import { AxiosResponse } from 'axios'
import { useAxiosStore } from '../axios-store'
import { ApiError } from 'src/utils/types'
import { handleError } from 'src/utils/notification-utils'

interface SimpleApiBackedRepo {
  // TODO: access T.entity somehow. In the meantime just have a string property.
  apidir: string
}

// iCreateT is basically the model's mandatory fields minus id since a new object won't be assigned an ID yet.
// T can implement iCreateT but what really matters is iCreateT should be what that API expects
// iUpdateT is meant to be all optional a subset of properties can be updated
// todo: support optional UUID client-side id generation
export default abstract class GenericRepo<iCreateT, iUpdateT extends iOptions, T extends iRecord>
  extends Repository<T>
  implements SimpleApiBackedRepo
{
  apidir = ''

  // todo: use DI perhaps, to specify the shape of a headers provider
  // todo: handle null/undefined commonHeader in case of none required
  // todo: place common header in all calls
  commonHeader = () => {
    try {
      const auth = useAuthenticationStore()
      return { headers: { Authorization: auth.bearerToken } }
    } catch (error) {
      console.error(`error in commonHeader: ${error}`)
    }
  }

  api = () => {
    try {
      return useAxiosStore().axios()
    } catch (error) {
      console.error(`error in api dynamic assembly: ${error}`)
      throw new Error(`error in api dynamic assembly: ${error}`)
    }
  }

  highestID = () => {
    // todo: it would be nice if id wasn't always nullable. Perhaps Model could make id not-null
    return this.all().reduce((max, x) => ((x.id ?? 0) > (max.id ?? 0) ? x : max))
  }

  fetch = async () => {
    await this.api()
      .get(`/${this.apidir}`, this.commonHeader())
      .then((response: AxiosResponse) => {
        // console.debug(`${this.apidir} fetched: `, { response })
        this.fresh(response.data as T[])
      }, handleError(`Could not fetch all ${this.apidir}`))
  }

  getId = async (id: number): Promise<T | null> => {
    return await this.api()
      .get(`/${this.apidir}/${id}`, this.commonHeader())
      .then(
        (response: AxiosResponse) => {
          // console.log(response.data as T)
          return this.save(response.data as T)
        },
        (error: ApiError) => {
          handleError(`Could not get ${this.apidir} id ${id}`)(error)
          return null
        }
      )
  }

  add = (newItem: iCreateT): Promise<T> => {
    // console.debug('add item: ', { newItem });

    return this.api()
      .post(`/${this.apidir}`, newItem, this.commonHeader())
      .then((response) => {
        // console.debug('response: ', response);
        return this.save(response.data as T)
      })
      .catch((error) => {
        console.error('Error adding item:', error)
        throw error // Re-throw the error to propagate it to the caller
      })
  }

  addMultiple = (newItems: iCreateT[]): Promise<T[]> => {
    // console.debug('add multiple')
    return this.api()
      .post(`/${this.apidir}`, newItems, this.commonHeader())
      .then((response) => {
        // console.debug({ response })
        this.save(response.data as T[])
        return response.data as T[]
      })
      .catch((error) => {
        console.error('Error adding item:', error)
        throw error
      })
  }

  delete = async (id: number) => {
    // todo: debug, info, and error handling
    await this.api().delete(`/${this.apidir}/${id}`, this.commonHeader())
    this.destroy(id)
  }

  update = async (itemOptions: iUpdateT) => {
    const start = performance.now()
    // console.debug(`${this.apidir} UPDATE`, { itemOptions })
    return this.api()
      .patch(`/${this.apidir}/${itemOptions.id}`, itemOptions.payload, this.commonHeader())
      .then((response) => {
        const result = this.save(response.data as T)
        // console.debug({'generic repo update result': result })
        const duration = performance.now() - start
        if (duration > 400)
          console.warn(
            `Patching server took longer than target of 400ms - it took ${Math.floor(duration)}ms`
          )
        return result
      }, handleError('Error updating record'))
  }

  localUpdate = (itemOptions: iUpdateT) => {
    this.update(itemOptions)
  }
  /**
   * gets a sorted array of all records of a store, plus optionally all of its related entities.
   * @param sort - a sorting function (a, b) => number
   * @param includeEntity - '**' invokes withAllRecursive; '*' invokes withAll.
   * @returns all records in a store, sorted with the provided function.
   * @example // sort by id, get all related records recursively.
   * useRepo(TaskRepo).sorted((a, b) => a.id - b.id, '**')
   */
  sorted = (sort: (a: T, b: T) => number, includeEntity?: string) => {
    if (typeof includeEntity === 'undefined') return this.all().sort(sort)
    if (includeEntity === '**') return this.withAllRecursive().get().sort(sort)
    if (includeEntity === '*') return this.withAll().get().sort(sort)
    return this.with(includeEntity).get().sort(sort)
  }
}
