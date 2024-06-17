import axios, { AxiosRequestConfig } from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { mockTaskList } from './tasks'
import { λ } from 'src/types'

const mockServerState = {
  tasks: mockTaskList
}

const fetchState = (entity: string) => {
  const hasThisData = entity in mockServerState
  if (!hasThisData) throw new Error('Server does not contain this data.')
  return mockServerState[entity as keyof typeof mockServerState]
}

const mock = new MockAdapter(axios)
type CallbackResponseSpecFunc = (config: AxiosRequestConfig) => any[] | Promise<any[]>
const mockResponse = (code: number) => (message: unknown) => [code, { message }]
const error400 = mockResponse(400)
const error500 = mockResponse(500)
const okdk = mockResponse(200)
const withAuth: λ<CallbackResponseSpecFunc, CallbackResponseSpecFunc> =
  (func: CallbackResponseSpecFunc) => (config: AxiosRequestConfig) => {
    const { headers } = config
    // todo: simulate api.tdl.app responses accurately
    if (typeof headers === 'undefined') return error400('no header data')
    const { Authorization } = headers
    if (typeof Authorization === 'undefined') return error400('no authorization header data')
    return func(config)
  }
const tryIt: λ<CallbackResponseSpecFunc, CallbackResponseSpecFunc> =
  (func: CallbackResponseSpecFunc) => (config: AxiosRequestConfig) => {
    try {
      return func(config)
    } catch (error) {
      return error500(error)
    }
  }
const undef = <T>(x?: T): x is undefined => typeof x === 'undefined'
const getUrlFromConfig = (config: AxiosRequestConfig) => {
  const { url } = config
  if (undef(url)) throw new Error('no url string')
  return url
}
const getEntityNameFromURL = (url: string) => {
  // todo: verify this is the appropriate coordinate for the entity
  // ie, will this return the empty string to the left of the first forward-slash that is at position 0 of the url string
  // todo: what will split do if nothing is to the right of the string?
  // ie, is checking for undefined the appropriate validation step here?
  const name = url.split('/')[0]
  if (undef(name)) throw new Error('no entity name in url')
  return name
}
const getIdFromURL = (url: string) => {
  const idStr = url.split('/')[1]
  if (undef(idStr)) throw new Error('no id in url')
  const id = parseInt(idStr)
  // what does parseInt do in case of bad input? error? -1? null?
  return id
}
const fetchStateFromConfig = (config: AxiosRequestConfig) => {
  try {
    const url = getUrlFromConfig(config)
    const entity = getEntityNameFromURL(url)
    const data = fetchState(entity)
    return data
  } catch (error) {
    throw error
  }
}
const fetchDataFromConfig = (config: AxiosRequestConfig) => {
  const { data } = config
  if (undef(data)) throw new Error('no data in request')
  return data
}
mock.onGet(/\/(\w+)/).reply(withAuth(tryIt((config) => okdk(fetchStateFromConfig(config)))))
const getIdFromConfig = (config: AxiosRequestConfig) => {
  try {
    return getIdFromURL(getUrlFromConfig(config))
  } catch (error) {
    throw error
  }
}
const findRecordIndexWithIdFromConfig = (config: AxiosRequestConfig) => {
  try {
    const state = fetchStateFromConfig(config)
    const id = getIdFromConfig(config)
    const index = state.findIndex((x) => x.id === id)
    if (index < 0) throw new Error('id not found in entity list')
    return index
  } catch (error) {
    throw error
  }
}
mock.onDelete(/\/(\w+)\/\d+/).reply(
  withAuth(
    tryIt((config) => {
      const index = findRecordIndexWithIdFromConfig(config)
      const state = fetchStateFromConfig(config)
      state.splice(index, 1)
      return okdk('deleted the task')
    })
  )
)
mock.onGet(/\/(\w+)\/\d+/).reply(
  withAuth(
    tryIt((config) => {
      const index = findRecordIndexWithIdFromConfig(config)
      const state = fetchStateFromConfig(config)
      return [200, { data: state[index] }]
    })
  )
)
mock.onPost(/\/(\w+)/).reply(
  withAuth(
    tryIt((config) => {
      const state = fetchStateFromConfig(config)
      // type recordType =
      const data = fetchDataFromConfig(config)
      // state.push(data)
      return [200, { data }]
    })
  )
)
