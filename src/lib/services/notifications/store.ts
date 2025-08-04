import { create } from 'zustand';

interface NotificationMeta {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationMeta[];
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
}

import { notificationService } from './api';

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: false,
  error: null,
  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const notifications = await notificationService.getUserNotifications();
      set({ notifications, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));