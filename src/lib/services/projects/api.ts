import apiClient, { handleApiResponse, handleApiError } from '../api';
import { Project, PaginatedResponse } from '@/lib/types';

export const projectService = {
  // Tüm projeleri getir
  async getAllProjects(): Promise<PaginatedResponse<Project>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Project>>('/projects');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Projeyi ID ile getir
  async getProjectById(id: string): Promise<Project> {
    try {
      const response = await apiClient.get<Project>(`/projects/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Yeni proje oluştur
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const response = await apiClient.post<Project>('/projects', project);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Proje güncelle
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const response = await apiClient.put<Project>(`/projects/${id}`, updates);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Proje sil
  async deleteProject(id: string): Promise<void> {
    try {
      await apiClient.delete(`/projects/${id}`);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Durum bazında projeleri getir
  async getProjectsByStatus(status: Project['status']): Promise<PaginatedResponse<Project>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Project>>(`/projects?status=${status}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Sahip bazında projeleri getir
  async getProjectsByOwner(ownerId: string): Promise<PaginatedResponse<Project>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Project>>(`/projects?ownerId=${ownerId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Ekip üyesi bazında projeleri getir
  async getProjectsByTeamMember(memberId: string): Promise<PaginatedResponse<Project>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Project>>(`/projects?memberId=${memberId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Proje istatistiklerini getir
  async getProjectStats(projectId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    totalHours: number;
    progress: number;
  }> {
    try {
      const response = await apiClient.get(`/projects/${projectId}/stats`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Proje üyelerini getir
  async getProjectMembers(projectId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/projects/${projectId}/members`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Projeye üye ekle
  async addProjectMember(projectId: string, userId: string, role: string): Promise<void> {
    try {
      await apiClient.post(`/projects/${projectId}/members`, { userId, role });
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Projeden üye çıkar
  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    try {
      await apiClient.delete(`/projects/${projectId}/members/${userId}`);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },
};