import { defineStore } from 'pinia';
import { IProjectsState } from './i-projects-state';
import { ICreateProjectOptions } from './i-create-project-options';
import { api } from 'src/boot/axios';
import { useAuthenticationStore } from '../authentication/pinia-authentication';
import { IUpdateProjectOptions } from './i-update-project-options';
import { useRepo } from 'pinia-orm';
import Project from 'src/models/project';

export const useProjectsStore = defineStore('projects', {
  state: (): IProjectsState => {
    return {}
  },

  actions: {
    async create(options: ICreateProjectOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.post('/projects',
            {
              title: options.title,
              notes: options.notes
            },
            {
              headers: {
                Authorization: authenticationStore.getBearerToken
              }
            }
          ).
          then(
            (response) => {
              useRepo(Project).save(response.data)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async delete(options: { id: number }) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.delete(`/projects/${options.id}`, {
            headers: {
              Authorization: authenticationStore.getBearerToken
            }
          }).
          then(
            (response) => {
              useRepo(Project).destroy(options.id)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async update(options: IUpdateProjectOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.patch(`/projects/${options.id}`,
            {
              title: options.title,
              notes: options.notes
            },
            {
              headers: {
                Authorization: authenticationStore.getBearerToken
              }
            }
          ).
          then(
            (response) => {
              useRepo(Project).save(response.data)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async fetchProjects() {
      const authenticationStore = useAuthenticationStore()
      const response = await api.get('/projects', {
        headers: { Authorization: authenticationStore.getBearerToken },
        params: {}
      })
      useRepo(Project).fresh(response.data)
      return response
    },
  }
})