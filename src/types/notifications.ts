// src/types/notifications.ts
export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_completed' | 'task_overdue' | 'system';
  read: boolean;
  link?: string;
  created_at: string;
}

export type CreateNotification = {
  user_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}