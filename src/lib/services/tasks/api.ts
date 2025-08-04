import { Task, FilterOptions, PaginatedResponse } from '@/lib/types';

const API_BASE_URL = 'https://yap-nest-axplyzlx3-berkans-projects-d2fa45cc.vercel.app';

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
  async getAllTasks(filters?: FilterOptions): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
    return apiRequest(endpoint);
  },

  async getTaskById(id: string): Promise<Task> {
    return apiRequest(`/tasks/${id}`);
  },

  async createTask(taskData: {
    title: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assigneeId?: string;
    projectId: string;
    dueDate?: string;
    estimatedHours?: number;
    parentTaskId?: string;
    tags?: string[];
  }): Promise<Task> {
    return apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async updateTask(id: string, updates: Partial<{
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigneeId: string;
    dueDate: string;
    estimatedHours: number;
    actualHours: number;
    parentTaskId: string;
    tags: string[];
  }>): Promise<Task> {
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

  async getTasksByProject(projectId: string): Promise<PaginatedResponse<Task>> {
    return apiRequest(`/tasks?projectId=${projectId}`);
  },

  async getTasksByStatus(status: Task['status']): Promise<PaginatedResponse<Task>> {
    return apiRequest(`/tasks?status=${status}`);
  },

  async getTasksByAssignee(assigneeId: string): Promise<PaginatedResponse<Task>> {
    return apiRequest(`/tasks?assigneeId=${assigneeId}`);
  },

  async getOverdueTasks(): Promise<PaginatedResponse<Task>> {
    return apiRequest('/tasks/overdue');
  },
};