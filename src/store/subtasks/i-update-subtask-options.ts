import { ICreateSubtaskOptions } from './i-create-subtask-options';

export interface IUpdateSubtaskOptions extends ICreateSubtaskOptions {
  id: number
}