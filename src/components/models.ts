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
