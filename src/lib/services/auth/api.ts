import apiClient, { handleApiResponse, handleApiError } from '../api';
import { LoginRequest, LoginResponse, User } from '@/lib/types';

export const authService = {
  // Kullanıcı girişi
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      const data = handleApiResponse(response);
      
      // Token'ı localStorage'a kaydet
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
      }
      
      return data;
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcı çıkışı
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  },

  // Kullanıcı kaydı
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', userData);
      const data = handleApiResponse(response);
      
      // Token'ı localStorage'a kaydet
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
      }
      
      return data;
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Mevcut kullanıcı bilgilerini getir
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/profile');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcı güncelle
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>('/auth/profile', updates);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Şifre değiştir
  async changePassword(passwords: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', passwords);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcının giriş yapmış olup olmadığını kontrol et
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Token'ı getir
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  },
};