import { DashboardStats } from '@/lib/types';
const API_BASE_URL = 'https://yap-nest-pa3xjusm2-berkans-projects-d2fa45cc.vercel.app';
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  const response = await fetch(url, config);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};
export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiRequest('/dashboard/stats');
  },
  async getRecentActivities(): Promise<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    userId: string;
  }>> {
    return apiRequest('/dashboard/activities');
  },
  async getProjectProgress(): Promise<Array<{
    id: string;
    title: string;
    progress: number;
    status: string;
  }>> {
    return apiRequest('/dashboard/project-progress');
  },
  async getTaskAnalytics(): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
  }> {
    return apiRequest('/dashboard/task-analytics');
  },
};