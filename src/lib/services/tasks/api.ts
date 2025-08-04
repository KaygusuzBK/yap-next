import { Task } from '@/lib/types';
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
export const taskService = {
  async getAllTasks(): Promise<Task[]> {
    return apiRequest('/tasks');
  },
  async getTaskById(id: string): Promise<Task> {
    return apiRequest(`/tasks/${id}`);
  },
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  async deleteTask(id: string): Promise<void> {
    return apiRequest(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
  async getTasksByProject(projectId: string): Promise<Task[]> {
    return apiRequest(`/tasks?projectId=${projectId}`);
  },
  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    return apiRequest(`/tasks?status=${status}`);
  },
  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    return apiRequest(`/tasks?assigneeId=${assigneeId}`);
  },
  async getOverdueTasks(): Promise<Task[]> {
    return apiRequest('/tasks/overdue');
  },
};