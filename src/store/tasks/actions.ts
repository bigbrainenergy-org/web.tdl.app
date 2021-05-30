// @ts-nocheck
import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { TasksStateInterface } from './state';
import { api } from 'boot/axios';
import Task from '../../models/task'

const actions: ActionTree<TasksStateInterface, StateInterface> = {
  async fetchTasks({ commit, getters, rootGetters }) {
    const response = await api.get('/tasks', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    this.$repo(Task).fresh(response.data)
    return response
  },

  async clearCompleted({ commit, getters, rootGetters }) {
    return new Promise(
      (resolve, reject) => {
        api.post('/tasks/clear-completed',
          {},
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Task).fresh(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async markComplete({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch(`/tasks/${options.id}/mark-complete`,
          {},
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async markIncomplete({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch(`/tasks/${options.id}/mark-incomplete`,
          {},
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async delete({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.delete(`/tasks/${options.id}`, {
          headers: {
            Authorization: rootGetters['authentication/bearerToken']
          }
        }).
        then(
          (response) => {
            this.$repo(Task).destroy(options.id)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async bulkUpdate({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch('/tasks/bulk',
          {
            task_ids: options.task_ids,
            review_at: options.review_at
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async create({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.post('/tasks',
          {
            title: options.title,
            list_id: options.list_id,
            tag_ids: options.tag_ids,
            notes: options.notes,
            review_at: options.review_at,
            remind_me_at: options.remind_me_at,
            prioritize_at: options.prioritize_at,
            deadline_at: options.deadline_at
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async createPrereq({ commit, dispatch, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        dispatch('create', options.taskOptions).
        then(
          (response) => {
            dispatch('addPrereq', {
              id: options.id,
              pre_task_id: response.data.id
            }).then(
              (response) => {
                resolve(response)
              },
              (error) => {
                reject(error)
              }
            )
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async createPostreq({ commit, dispatch, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        dispatch('create', options.taskOptions).
        then(
          (response) => {
            dispatch('addPostreq', {
              id: options.id,
              post_task_id: response.data.id
            }).then(
              (response) => {
                resolve(response)
              },
              (error) => {
                reject(error)
              }
            )
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async update({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch(`/tasks/${options.id}`,
          {
            title: options.title,
            notes: options.notes,
            review_at: options.review_at,
            remind_me_at: options.remind_me_at,
            prioritize_at: options.prioritize_at,
            deadline_at: options.deadline_at
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async updateTags({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch(`/tasks/${options.id}/tags`,
          {
            tags: options.tags
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async updateList({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch(`/tasks/${options.id}/list`,
          {
            list_id: options.list_id
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async addPrereq({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch(`/tasks/${options.id}/pre`,
          {
            pre_task_id: options.pre_task_id
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async addPostreq({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch(`/tasks/${options.id}/post`,
          {
            post_task_id: options.post_task_id
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async removePrereq({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.delete(`/tasks/${options.id}/pre/${options.pre_task_id}`, {
          headers: {
            Authorization: rootGetters['authentication/bearerToken']
          }
        }).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async removePostreq({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.delete(`/tasks/${options.id}/post/${options.post_task_id}`, {
          headers: {
            Authorization: rootGetters['authentication/bearerToken']
          }
        }).
        then(
          (response) => {
            this.$repo(Task).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },
};

export default actions;
