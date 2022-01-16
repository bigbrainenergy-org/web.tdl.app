import { GetterTree } from 'vuex';
import { StateInterface } from '../index';
import { NextActionsStateInterface } from './state';
import NextAction from '../../models/next_action'

const getters: GetterTree<NextActionsStateInterface, StateInterface> = {};

export default getters;
