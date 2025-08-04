import apiClient, { handleApiResponse, handleApiError } from '../api';
import { DashboardStats } from '@/lib/types';

export const dashboardService = {
  // Dashboard istatistiklerini getir
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Son aktiviteleri getir
  async getRecentActivities(): Promise<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    userId: string;
    user?: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>> {
    try {
      const response = await apiClient.get('/dashboard/activities');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcı dashboard verilerini getir
  async getUserDashboard(userId: string): Promise<{
    stats: DashboardStats;
    recentProjects: any[];
    recentTasks: any[];
    upcomingDeadlines: any[];
    teamActivity: any[];
  }> {
    try {
      const response = await apiClient.get(`/dashboard/user/${userId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Proje dashboard verilerini getir
  async getProjectDashboard(projectId: string): Promise<{
    projectStats: {
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      overdueTasks: number;
      totalHours: number;
      progress: number;
    };
    recentTasks: any[];
    teamMembers: any[];
    recentComments: any[];
  }> {
    try {
      const response = await apiClient.get(`/dashboard/project/${projectId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Takım performansını getir
  async getTeamPerformance(): Promise<{
    teamStats: {
      totalMembers: number;
      activeMembers: number;
      totalProjects: number;
      completedProjects: number;
      totalTasks: number;
      completedTasks: number;
    };
    memberPerformance: Array<{
      userId: string;
      name: string;
      avatar?: string;
      completedTasks: number;
      totalHours: number;
      efficiency: number;
    }>;
  }> {
    try {
      const response = await apiClient.get('/dashboard/team-performance');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Zaman çizelgesi verilerini getir
  async getTimelineData(): Promise<Array<{
    id: string;
    type: 'project' | 'task' | 'milestone';
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
    assignee?: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>> {
    try {
      const response = await apiClient.get('/dashboard/timeline');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },
};