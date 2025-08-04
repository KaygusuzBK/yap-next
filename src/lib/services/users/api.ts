import { User } from '@/lib/types';
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