export interface Tag {
  id: number,
  title: string;
  order: number;
}

export interface List {
  id: number;
  title: string;
  order: number;
}

export interface Task {
  id: number;
  title: string;
  list_id: number;
  tag_ids: Array<number>;
  list: List;
  tags: Array<Tag>;
  order: number;
  review_at: string;
  remind_me_at: string;
  prioritize_at: string;
  deadline_at: string;
  completed_at: string;
  prereqs: Array<any>;
}

export interface TimeZone {
  name: string;
  value: string;
}

export interface Notification {
  id: number;
  title?: string;
  body?: string;
  schedule?: any;
  group?: string;
  channelId?: string;
  sound?: string;
  smallIcon?: string;
  iconColor?: string;
}

export interface InboxItem {
  id: number;
  title: string;
  notes?: string;
}

export interface NextAction {
  id: number;
  project?: Project;
  context?: Context;
  title: string;
  notes?: string;
  order: number;
  completed: boolean;
  remind_me_at?: string;
  hard_prereqs: Array<any>;
  hard_postreqs: Array<any>;
}

export interface WaitingFor {
  id: number;
  title: string;
  notes?: string;
}

export interface Project {
  id: number;
  title: string;
  notes?: string;
  superprojects: Array<any>;
  subprojects: Array<any>;
}

export interface Context {
  id: number;
  title: string;
  color: string;
  icon: string;
  order: number;
  next_actions: Array<NextAction>
}

export interface User {
  id: number;
  username: string;
  locale: string;
  time_zone: string;
}
