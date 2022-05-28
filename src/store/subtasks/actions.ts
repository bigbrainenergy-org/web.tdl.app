// @ts-nocheck
import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { SubtasksStateInterface } from './state';
import { api } from 'boot/axios';
import Subtask from '../../models/subtask'

const actions: ActionTree<SubtasksStateInterface, StateInterface> = {
  async create({ rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.post('/subtasks',
          {
            title: options.title,
            order: options.order,
            completed: options.completed,
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Subtask).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async delete({ rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.delete(`/subtasks/${options.id}`, {
          headers: {
            Authorization: rootGetters['authentication/bearerToken']
          }
        }).
        then(
          (response) => {
            this.$repo(Subtask).destroy(options.id)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async update({ rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch(`/subtasks/${options.id}`,
          {
            title: options.title,
            order: options.order,
            completed: options.completed,
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Subtask).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async fetchSubtasks({ rootGetters }) {
    const response = await api.get('/subtasks', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    this.$repo(Subtask).fresh(response.data)
    return response
  },
};

export default actions;
