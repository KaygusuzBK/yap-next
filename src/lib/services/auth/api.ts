import apiClient, { handleApiResponse, handleApiError } from '../api';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User 
} from '@/lib/types';

export const authService = {
  // Kullanıcı girişi
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    const data = handleApiResponse(response);
    
    // Token'ı localStorage'a kaydet
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  },

  // Kullanıcı kaydı
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', userData);
    const data = handleApiResponse(response);
    
    // Token'ı localStorage'a kaydet
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  },

  // Token yenileme
  async refresh(): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/refresh');
    const data = handleApiResponse(response);
    
    // Yeni token'ı localStorage'a kaydet
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  },

  // Kullanıcı profili
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return handleApiResponse(response);
  },

  // Şifre sıfırlama isteği
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return handleApiResponse(response);
  },

  // Şifre sıfırlama (token ile)
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword });
    return handleApiResponse(response);
  },

  // Şifre değiştirme
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
    return handleApiResponse(response);
  },

  // Çıkış
  async logout(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/logout');
      const data = handleApiResponse(response);
      
      // Token'ı localStorage'dan temizle
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      
      return data;
    } catch (error) {
      // Backend hatası durumunda bile token'ı temizle
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      throw error;
    }
  },

  // Kimlik doğrulama durumu kontrolü
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Token alma
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }
};