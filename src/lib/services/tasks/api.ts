import apiClient, { handleApiResponse, handleApiError } from '../api';
import { Task, PaginatedResponse } from '@/lib/types';

export const taskService = {
  // Tüm görevleri getir
  async getAllTasks(): Promise<PaginatedResponse<Task>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Task>>('/tasks');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Görevi ID ile getir
  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await apiClient.get<Task>(`/tasks/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Yeni görev oluştur
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    try {
      const response = await apiClient.post<Task>('/tasks', task);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Görev güncelle
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const response = await apiClient.put<Task>(`/tasks/${id}`, updates);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Görev sil
  async deleteTask(id: string): Promise<void> {
    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Proje bazında görevleri getir
  async getTasksByProject(projectId: string): Promise<PaginatedResponse<Task>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Task>>(`/tasks?projectId=${projectId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Durum bazında görevleri getir
  async getTasksByStatus(status: Task['status']): Promise<PaginatedResponse<Task>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Task>>(`/tasks?status=${status}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Atanan kişi bazında görevleri getir
  async getTasksByAssignee(assigneeId: string): Promise<PaginatedResponse<Task>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Task>>(`/tasks?assigneeId=${assigneeId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Öncelik bazında görevleri getir
  async getTasksByPriority(priority: Task['priority']): Promise<PaginatedResponse<Task>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Task>>(`/tasks?priority=${priority}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Geciken görevleri getir
  async getOverdueTasks(): Promise<PaginatedResponse<Task>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Task>>('/tasks?overdue=true');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Tag bazında görevleri getir
  async getTasksByTag(tag: string): Promise<PaginatedResponse<Task>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Task>>(`/tasks?tag=${tag}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Görev durumunu güncelle
  async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    try {
      const response = await apiClient.patch<Task>(`/tasks/${id}/status`, { status });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Görev önceliğini güncelle
  async updateTaskPriority(id: string, priority: Task['priority']): Promise<Task> {
    try {
      const response = await apiClient.patch<Task>(`/tasks/${id}/priority`, { priority });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Görev atamasını güncelle
  async assignTask(id: string, assigneeId: string): Promise<Task> {
    try {
      const response = await apiClient.patch<Task>(`/tasks/${id}/assign`, { assigneeId });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Görev saatlerini güncelle
  async updateTaskHours(id: string, actualHours: number): Promise<Task> {
    try {
      const response = await apiClient.patch<Task>(`/tasks/${id}/hours`, { actualHours });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Alt görevleri getir
  async getSubTasks(parentTaskId: string): Promise<PaginatedResponse<Task>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Task>>(`/tasks?parentTaskId=${parentTaskId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },
};