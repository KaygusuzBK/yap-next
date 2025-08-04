import { Project } from '@/lib/types';
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