import { defineStore } from 'pinia';
import { IProjectsState } from './i-projects-state';

export const useProjectsStore = defineStore('projects', {
  state: (): IProjectsState => {
    return {}
  }
})