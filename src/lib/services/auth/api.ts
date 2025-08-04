import { User } from '@/lib/types';

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

export const authService = {
  async register(userData: { name: string; email: string; password: string; avatar?: string; role?: string }) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  async login(credentials: { email: string; password: string; rememberMe?: boolean }) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.token) localStorage.setItem('authToken', response.token);
    return response;
  },
  async refresh() {
    const response = await apiRequest('/auth/refresh', {
      method: 'POST',
    });
    if (response.token) localStorage.setItem('authToken', response.token);
    return response;
  },
  async getProfile(): Promise<User> {
    return apiRequest('/auth/profile');
  },
  async changePassword(passwords: { currentPassword: string; newPassword: string }) {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwords),
    });
  },
  async forgotPassword(email: string) {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword(data: { token: string; newPassword: string }) {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async logout() {
    await apiRequest('/auth/logout', {
      method: 'POST',
    });
    localStorage.removeItem('authToken');
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },
};