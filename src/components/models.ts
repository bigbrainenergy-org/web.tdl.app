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
  mental_energy_required: number;
  physical_energy_required: number;
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
