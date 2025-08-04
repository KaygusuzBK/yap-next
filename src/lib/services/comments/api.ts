import { Comment, FilterOptions, PaginatedResponse } from '@/lib/types';

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

export const commentService = {
  async getAllComments(filters?: FilterOptions): Promise<PaginatedResponse<Comment>> {
    const params = new URLSearchParams();
    if (filters?.taskId) params.append('taskId', filters.taskId);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.authorId) params.append('authorId', filters.authorId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/comments?${queryString}` : '/comments';
    return apiRequest(endpoint);
  },

  async getCommentsByTask(taskId: string): Promise<PaginatedResponse<Comment>> {
    return apiRequest(`/comments?taskId=${taskId}`);
  },

  async getCommentsByProject(projectId: string): Promise<PaginatedResponse<Comment>> {
    return apiRequest(`/comments?projectId=${projectId}`);
  },

  async createComment(commentData: {
    content: string;
    taskId?: string;
    projectId?: string;
  }): Promise<Comment> {
    return apiRequest('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },

  async updateComment(id: string, updates: {
    content: string;
  }): Promise<Comment> {
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