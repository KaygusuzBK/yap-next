import { supabase } from '@/lib/supabase';
import { Notification, CreateNotificationRequest, UpdateNotificationRequest } from '@/lib/types';

export const notificationService = {
  // Kullanıcının bildirimlerini getir
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map((notification: any) => ({
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.is_read,
        projectId: notification.project_id,
        taskId: notification.task_id,
        actionUrl: notification.action_url,
        createdAt: notification.created_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Okunmamış bildirimleri getir
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((notification: any) => ({
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.is_read,
        projectId: notification.project_id,
        taskId: notification.task_id,
        actionUrl: notification.action_url,
        createdAt: notification.created_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Bildirim oluştur
  async createNotification(notification: CreateNotificationRequest): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          project_id: notification.projectId,
          task_id: notification.taskId,
          action_url: notification.actionUrl
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: data.is_read,
        projectId: data.project_id,
        taskId: data.task_id,
        actionUrl: data.action_url,
        createdAt: data.created_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Bildirim güncelle
  async updateNotification(id: string, updates: UpdateNotificationRequest): Promise<Notification> {
    try {
      const updateData: any = {};
      
      if (updates.isRead !== undefined) updateData.is_read = updates.isRead;

      const { data, error } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: data.is_read,
        projectId: data.project_id,
        taskId: data.task_id,
        actionUrl: data.action_url,
        createdAt: data.created_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Bildirimi okundu olarak işaretle
  async markAsRead(id: string): Promise<Notification> {
    return this.updateNotification(id, { isRead: true });
  },

  // Tüm bildirimleri okundu olarak işaretle
  async markAllAsRead(userId: string): Promise<{ message: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { message: 'Tüm bildirimler okundu olarak işaretlendi' };
    } catch (error) {
      throw error;
    }
  },

  // Bildirim sil
  async deleteNotification(id: string): Promise<{ message: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { message: 'Bildirim başarıyla silindi' };
    } catch (error) {
      throw error;
    }
  },

  // Kullanıcının tüm bildirimlerini sil
  async deleteAllNotifications(userId: string): Promise<{ message: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return { message: 'Tüm bildirimler silindi' };
    } catch (error) {
      throw error;
    }
  },

  // Okunmamış bildirim sayısını getir
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      throw error;
    }
  },

  // Proje ile ilgili bildirimleri getir
  async getProjectNotifications(userId: string, projectId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((notification: any) => ({
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.is_read,
        projectId: notification.project_id,
        taskId: notification.task_id,
        actionUrl: notification.action_url,
        createdAt: notification.created_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Görev ile ilgili bildirimleri getir
  async getTaskNotifications(userId: string, taskId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((notification: any) => ({
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.is_read,
        projectId: notification.project_id,
        taskId: notification.task_id,
        actionUrl: notification.action_url,
        createdAt: notification.created_at
      }));
    } catch (error) {
      throw error;
    }
  }
}; 