import { Model } from 'pinia-orm';
import iRecord, { iOptions } from '../generics/i-record';
import { Attr, HasMany, Num, Str } from 'pinia-orm/dist/decorators';
import GenericRepo from '../generics/generic-repo';
import { Task } from '../tasks/task'

export interface CreateListOptions {
  title: string
  order?: number
}

export interface UpdateListOptions extends iOptions {
  id: number,
  payload: {
    list: {
      title?: string
      order?: number
    }
  }
}

export class List extends Model implements iRecord {
  static entity = 'lists';

  // todo: don't just use attr
  @Attr(null) declare id: number | null;
  @Str('') declare title: string;
  @Str('') declare color: string;
  @Num(0) declare order: number;

  @HasMany(() => Task, 'list_id') declare tasks: Task[];
}

export class ListRepo extends GenericRepo<CreateListOptions, UpdateListOptions, List> {
  use = List
  apidir = List.entity;
}
