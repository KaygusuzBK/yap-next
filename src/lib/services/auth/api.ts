import apiClient, { handleApiResponse, handleApiError } from '../api';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  ChangePasswordRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  User 
} from '@/lib/types';

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

  // Kullanıcı kaydı
  async register(userData: RegisterRequest): Promise<LoginResponse> {
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

  // Token yenileme
  async refresh(): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/refresh');
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

  // Kullanıcı profili
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/profile');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Şifre sıfırlama isteği
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Token ile şifre sıfırlama
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/reset-password', { 
        token, 
        newPassword 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Şifre değiştirme
  async changePassword(passwords: ChangePasswordRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<{ message: string }>('/auth/change-password', passwords);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcı çıkışı
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
      // Hata olsa bile token'ı temizle
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
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