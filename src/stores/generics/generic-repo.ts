import { Repository } from 'pinia-orm'
import iRecord, { iOptions } from './i-record'
import { useAuthenticationStore } from '../authentication/pinia-authentication'
import { Utils } from 'src/util'
import { AxiosResponse } from 'axios'
import { useAxiosStore } from '../axios-store'

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
      return { headers: { Authorization: auth.bearerToken }}
    } catch(error) {
      console.error(`error in commonHeader: ${error}`)
    }
  }

  api = () => {
    try {
      return useAxiosStore().axios()
    } catch(error) {
      console.error(`error in api dynamic assembly: ${error}`)
      throw new Error(`error in api dynamic assembly: ${error}`)
    }
  }

  highestID = () => {
    // todo: it would be nice if id wasn't always nullable. Perhaps Model could make id not-null
    return this.all().reduce((max, x) =>
      (x.id ?? 0) > (max.id ?? 0) ? x : max
    )
  }

  fetch = async () => {
    await this.api().get(
      `/${this.apidir}`,
      this.commonHeader()
    ).
    then(
      (response: AxiosResponse) => {
        console.debug(`${this.apidir} fetched: `, { response })
        this.fresh(response.data as T[])
      },
      Utils.handleError(`Could not fetch all ${this.apidir}`)
    )
  }

  getId = async (id: number) => {
    await this.api().get(`/${this.apidir}/${id}`, this.commonHeader()).then((response: AxiosResponse) => {
      console.log(response.data as T[])
      this.save(response.data as T[])
    }, Utils.handleError(`Could not get ${this.apidir} id ${id}`))
  }

  add = (newItem: iCreateT): Promise<T> => {
    console.debug('add item: ', { newItem });
  
    return this.api().post(`/${this.apidir}`, newItem, this.commonHeader())
      .then(response => {
        console.debug('response: ', response);
        this.save(response.data as T);
        return response.data as T;
      })
      .catch(error => {
        console.error('Error adding item:', error);
        throw error; // Re-throw the error to propagate it to the caller
      });
  }

  addMultiple = (newItems: iCreateT[]): Promise<T[]> => {
    console.debug('add multiple')
    return this.api().post(`/${this.apidir}`, newItems, this.commonHeader())
    .then(response => {
      console.debug({ response })
      this.save(response.data as T[])
      return response.data as T[]
    })
    .catch(error => {
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
    // console.debug(`${this.apidir} UPDATE`)
    return this.api().patch(`/${this.apidir}/${itemOptions.id}`, itemOptions.payload, this.commonHeader())
    .then((response) => {
      this.save(response.data as T)
    }, Utils.handleError('Error updating record'))
  }

  // includeEntity: name of entity to include. * invokes withAll. ** invokes withAllRecursive.
  // todo: test if this sorts the store in-place
  sorted = (sort: (a: T, b: T) => number, includeEntity?: string) => {
    if (typeof includeEntity === 'undefined') return this.all().sort(sort)
    if (includeEntity === '**') return this.withAllRecursive().get().sort(sort)
    if (includeEntity === '*') return this.withAll().get().sort(sort)
    return this.with(includeEntity).get().sort(sort)
  }
}
