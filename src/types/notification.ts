export interface Notification {
  id: string;
  message: string;
  status: 'unread' | 'read';
  created_at?: string;
}