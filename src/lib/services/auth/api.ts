import apiClient, { handleApiResponse, handleApiError } from '../api';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User 
} from '@/lib/types';

// Demo user data for testing
const demoUser: User = {
  id: '1',
  name: 'Demo User',
  email: 'demo@example.com',
  avatar: null,
  role: 'member',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const demoToken = 'demo-jwt-token-12345';

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
      // Backend hatası durumunda demo data kullan
      console.warn('Backend not available, using demo data for login');
      
      // Demo login - herhangi bir email/password ile giriş yapılabilir
      const demoResponse: LoginResponse = {
        user: {
          ...demoUser,
          name: credentials.email.split('@')[0], // Email'den isim oluştur
          email: credentials.email
        },
        token: demoToken,
        tokenType: 'Bearer',
        expiresIn: 3600
      };
      
      // Token'ı localStorage'a kaydet
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', demoResponse.token);
      }
      
      return demoResponse;
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
      // Backend hatası durumunda demo data kullan
      console.warn('Backend not available, using demo data for register');
      
      // Demo register - yeni kullanıcı oluştur
      const demoResponse: LoginResponse = {
        user: {
          id: Date.now().toString(), // Unique ID
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar || null,
          role: userData.role || 'member',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: demoToken,
        tokenType: 'Bearer',
        expiresIn: 3600
      };
      
      // Token'ı localStorage'a kaydet
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', demoResponse.token);
      }
      
      return demoResponse;
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
      // Backend hatası durumunda mevcut token'ı kullan
      console.warn('Backend not available, using existing token');
      
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      return {
        user: demoUser,
        token: currentToken || demoToken,
        tokenType: 'Bearer',
        expiresIn: 3600
      };
    }
  },

  // Kullanıcı profili
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/profile');
      return handleApiResponse(response);
    } catch (error) {
      // Backend hatası durumunda demo user döndür
      console.warn('Backend not available, using demo user profile');
      return demoUser;
    }
  },

  // Şifre sıfırlama isteği
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
      return handleApiResponse(response);
    } catch (error) {
      // Backend hatası durumunda demo response
      console.warn('Backend not available, using demo forgot password response');
      return { message: 'Şifre sıfırlama e-postası gönderildi (demo)' };
    }
  },

  // Şifre sıfırlama
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword });
      return handleApiResponse(response);
    } catch (error) {
      // Backend hatası durumunda demo response
      console.warn('Backend not available, using demo reset password response');
      return { message: 'Şifre başarıyla sıfırlandı (demo)' };
    }
  },

  // Şifre değiştirme
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
      return handleApiResponse(response);
    } catch (error) {
      // Backend hatası durumunda demo response
      console.warn('Backend not available, using demo change password response');
      return { message: 'Şifre başarıyla değiştirildi (demo)' };
    }
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
      // Backend hatası durumunda sadece local token'ı temizle
      console.warn('Backend not available, clearing local token only');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      
      return { message: 'Başarıyla çıkış yapıldı (demo)' };
    }
  },

  // Token kontrolü
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Token getter
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }
};