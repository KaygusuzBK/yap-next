// Gerçek backend API'sine bağlanacak servis katmanı
// Vercel'de deploy edilmiş backend API'si

import { User, Project, Task, Comment, DashboardStats } from '@/lib/types';

const API_BASE_URL = 'https://yap-nest-pa3xjusm2-berkans-projects-d2fa45cc.vercel.app';

// API helper fonksiyonları
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Token varsa ekle
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Authentication servisleri
export const authService = {
  async register(userData: { name: string; email: string; password: string; avatar?: string }) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(credentials: { email: string; password: string }) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Token'ı localStorage'a kaydet
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  async logout() {
    localStorage.removeItem('authToken');
  },

  async getCurrentUser(): Promise<User> {
    return apiRequest('/auth/me');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },
};

// User servisleri
export const userService = {
  async getAllUsers(): Promise<User[]> {
    return apiRequest('/users');
  },

  async getUserById(id: string): Promise<User> {
    return apiRequest(`/users/${id}`);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteUser(id: string): Promise<void> {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Project servisleri
export const projectService = {
  async getAllProjects(): Promise<Project[]> {
    return apiRequest('/projects');
  },

  async getProjectById(id: string): Promise<Project> {
    return apiRequest(`/projects/${id}`);
  },

  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    return apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteProject(id: string): Promise<void> {
    return apiRequest(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    return apiRequest(`/projects?status=${status}`);
  },

  async getProjectsByOwner(ownerId: string): Promise<Project[]> {
    return apiRequest(`/projects?ownerId=${ownerId}`);
  },
};

// Task servisleri
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

// Comment servisleri
export const commentService = {
  async getCommentsByTask(taskId: string): Promise<Comment[]> {
    return apiRequest(`/comments?taskId=${taskId}`);
  },

  async getCommentsByProject(projectId: string): Promise<Comment[]> {
    return apiRequest(`/comments?projectId=${projectId}`);
  },

  async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    return apiRequest('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },

  async updateComment(id: string, updates: Partial<Comment>): Promise<Comment> {
    return apiRequest(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteComment(id: string): Promise<void> {
    return apiRequest(`/comments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Dashboard servisleri
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

// File upload servisleri
export const fileService = {
  async uploadFile(file: File, taskId?: string, projectId?: string): Promise<{
    id: string;
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (taskId) formData.append('taskId', taskId);
    if (projectId) formData.append('projectId', projectId);

    const url = `${API_BASE_URL}/files/upload`;
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  async getFilesByTask(taskId: string): Promise<Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
  }>> {
    return apiRequest(`/files?taskId=${taskId}`);
  },

  async getFilesByProject(projectId: string): Promise<Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
  }>> {
    return apiRequest(`/files?projectId=${projectId}`);
  },

  async deleteFile(fileId: string): Promise<void> {
    return apiRequest(`/files/${fileId}`, {
      method: 'DELETE',
    });
  },
};

// Notification servisleri
export const notificationService = {
  async getUserNotifications(): Promise<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>> {
    return apiRequest('/notifications');
  },

  async markAsRead(notificationId: string): Promise<void> {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  async markAllAsRead(): Promise<void> {
    return apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  },

  async getUnreadCount(): Promise<number> {
    return apiRequest('/notifications/unread-count');
  },
}; 