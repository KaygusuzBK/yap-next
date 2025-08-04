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
    if (response.token) localStorage.setItem('authToken', response.token);
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