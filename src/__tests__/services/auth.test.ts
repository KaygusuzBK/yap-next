import { authService } from '@/lib/services/auth/api';
import { LoginRequest, RegisterRequest } from '@/lib/types';

// Mock the API client and handlers
jest.mock('@/lib/services/api', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
  handleApiResponse: jest.fn(),
  handleApiError: jest.fn(),
}));

const mockApiClient = require('@/lib/services/api').default;
const mockHandleApiResponse = require('@/lib/services/api').handleApiResponse;
const mockHandleApiError = require('@/lib/services/api').handleApiError;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'member',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          avatar: null,
        },
        token: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });
      mockHandleApiResponse.mockReturnValue(mockResponse);

      const result = await authService.login(credentials);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', mockResponse.token);
    });

    it('should use demo data when backend fails', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await authService.login(credentials);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(credentials.email);
      expect(result.user.name).toBe('test'); // Email'den oluşturulan isim
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'demo-jwt-token-12345');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const userData: RegisterRequest = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'member',
      };

      const mockResponse = {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'member',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          avatar: null,
        },
        token: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });
      mockHandleApiResponse.mockReturnValue(mockResponse);

      const result = await authService.register(userData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', mockResponse.token);
    });

    it('should use demo data when backend fails', async () => {
      const userData: RegisterRequest = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'member',
      };

      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await authService.register(userData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.name).toBe(userData.name);
      expect(result.user.email).toBe(userData.email);
      expect(result.user.role).toBe(userData.role);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'demo-jwt-token-12345');
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'member',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          avatar: null,
        },
        token: 'new-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });
      mockHandleApiResponse.mockReturnValue(mockResponse);

      const result = await authService.refresh();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', mockResponse.token);
    });

    it('should use existing token when backend fails', async () => {
      localStorage.setItem('authToken', 'existing-token');
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await authService.refresh();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('existing-token');
    });
  });

  describe('getProfile', () => {
    it('should get profile successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'member',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        avatar: null,
      };

      mockApiClient.get.mockResolvedValue({ data: mockUser });
      mockHandleApiResponse.mockReturnValue(mockUser);

      const result = await authService.getProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockUser });
      expect(result).toEqual(mockUser);
    });

    it('should return demo user when backend fails', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await authService.getProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password email successfully', async () => {
      const email = 'test@example.com';
      const mockResponse = { message: 'Password reset email sent' };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });
      mockHandleApiResponse.mockReturnValue(mockResponse);

      const result = await authService.forgotPassword(email);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email });
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
    });

    it('should return demo message when backend fails', async () => {
      const email = 'test@example.com';
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await authService.forgotPassword(email);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email });
      expect(result).toEqual({ message: 'Şifre sıfırlama e-postası gönderildi (demo)' });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const token = 'reset-token';
      const newPassword = 'newpassword123';
      const mockResponse = { message: 'Password reset successfully' };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });
      mockHandleApiResponse.mockReturnValue(mockResponse);

      const result = await authService.resetPassword(token, newPassword);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', { token, newPassword });
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
    });

    it('should return demo message when backend fails', async () => {
      const token = 'reset-token';
      const newPassword = 'newpassword123';
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await authService.resetPassword(token, newPassword);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', { token, newPassword });
      expect(result).toEqual({ message: 'Şifre başarıyla sıfırlandı (demo)' });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const currentPassword = 'oldpass';
      const newPassword = 'newpass';
      const mockResponse = { message: 'Password changed successfully' };

      mockApiClient.put.mockResolvedValue({ data: mockResponse });
      mockHandleApiResponse.mockReturnValue(mockResponse);

      const result = await authService.changePassword(currentPassword, newPassword);

      expect(mockApiClient.put).toHaveBeenCalledWith('/auth/change-password', { currentPassword, newPassword });
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
    });

    it('should return demo message when backend fails', async () => {
      const currentPassword = 'oldpass';
      const newPassword = 'newpass';
      mockApiClient.put.mockRejectedValue(new Error('Network error'));

      const result = await authService.changePassword(currentPassword, newPassword);

      expect(mockApiClient.put).toHaveBeenCalledWith('/auth/change-password', { currentPassword, newPassword });
      expect(result).toEqual({ message: 'Şifre başarıyla değiştirildi (demo)' });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockResponse = { message: 'Logged out successfully' };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });
      mockHandleApiResponse.mockReturnValue(mockResponse);

      const result = await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('should clear token even if logout fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(result).toEqual({ message: 'Başarıyla çıkış yapıldı (demo)' });
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('authToken', 'test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      localStorage.removeItem('authToken');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token when exists', () => {
      localStorage.setItem('authToken', 'test-token');
      expect(authService.getToken()).toBe('test-token');
    });

    it('should return null when no token exists', () => {
      localStorage.removeItem('authToken');
      expect(authService.getToken()).toBe(null);
    });
  });
}); 