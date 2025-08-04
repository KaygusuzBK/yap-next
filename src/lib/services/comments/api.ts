import { Comment } from '@/lib/types';
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