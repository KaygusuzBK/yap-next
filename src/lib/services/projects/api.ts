import { Project, FilterOptions, PaginatedResponse } from '@/lib/types';

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

export const projectService = {
  async getAllProjects(filters?: FilterOptions): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/projects?${queryString}` : '/projects';
    return apiRequest(endpoint);
  },

  async getProjectById(id: string): Promise<Project> {
    return apiRequest(`/projects/${id}`);
  },

  async createProject(projectData: {
    title: string;
    description?: string;
    status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
    startDate: string;
    endDate?: string;
    budget?: number;
    progress?: number;
  }): Promise<Project> {
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  async updateProject(id: string, updates: Partial<{
    title: string;
    description: string;
    status: 'active' | 'completed' | 'on_hold' | 'cancelled';
    startDate: string;
    endDate: string;
    budget: number;
    progress: number;
  }>): Promise<Project> {
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

  async getProjectsByStatus(status: Project['status']): Promise<PaginatedResponse<Project>> {
    return apiRequest(`/projects?status=${status}`);
  },

  async getProjectsByOwner(ownerId: string): Promise<PaginatedResponse<Project>> {
    return apiRequest(`/projects?ownerId=${ownerId}`);
  },
};