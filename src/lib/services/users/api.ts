import apiClient, { handleApiResponse, handleApiError } from '../api';
import { User } from '@/lib/types';

export const userService = {
  // Tüm kullanıcıları getir
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcıyı ID ile getir
  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/users/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcı güncelle
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>(`/users/${id}`, updates);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcı sil
  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Rol bazında kullanıcıları getir
  async getUsersByRole(role: User['role']): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>(`/users?role=${role}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Aktif kullanıcıları getir
  async getActiveUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users?isActive=true');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcı avatarını güncelle
  async updateUserAvatar(id: string, avatarFile: File): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await apiClient.put<User>(`/users/${id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcı şifresini sıfırla
  async resetUserPassword(id: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(`/users/${id}/reset-password`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcıyı aktif/pasif yap
  async toggleUserStatus(id: string): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`/users/${id}/toggle-status`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcı istatistiklerini getir
  async getUserStats(id: string): Promise<{
    totalProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    totalHours: number;
    efficiency: number;
  }> {
    try {
      const response = await apiClient.get(`/users/${id}/stats`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcının projelerini getir
  async getUserProjects(id: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/users/${id}/projects`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcının görevlerini getir
  async getUserTasks(id: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/users/${id}/tasks`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },
};