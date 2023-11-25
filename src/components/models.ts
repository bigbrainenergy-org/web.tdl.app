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
