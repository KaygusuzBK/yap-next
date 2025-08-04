import { authService } from '@/lib/services/auth/api';
import apiClient, { handleApiResponse, handleApiError } from '@/lib/services/api';

// Mock the API client
jest.mock('@/lib/services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
  handleApiResponse: jest.fn(),
  handleApiError: jest.fn(),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockHandleApiResponse = handleApiResponse as jest.MockedFunction<typeof handleApiResponse>;
const mockHandleApiError = handleApiError as jest.MockedFunction<typeof handleApiError>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'mock-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      mockHandleApiResponse.mockReturnValueOnce(mockResponse);

      const result = await authService.login(credentials);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-token');
    });

    it('should handle login error', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong-password' };
      const error = new Error('Invalid credentials');

      mockApiClient.post.mockRejectedValueOnce(error);
      mockHandleApiError.mockImplementationOnce(() => {
        throw error;
      });

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'member' as const,
      };
      const mockResponse = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'mock-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      mockHandleApiResponse.mockReturnValueOnce(mockResponse);

      const result = await authService.register(userData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-token');
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'new-mock-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      mockHandleApiResponse.mockReturnValueOnce(mockResponse);

      const result = await authService.refresh();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'new-mock-token');
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      mockApiClient.get.mockResolvedValueOnce({ data: mockUser });
      mockHandleApiResponse.mockReturnValueOnce(mockUser);

      const result = await authService.getProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockUser });
      expect(result).toEqual(mockUser);
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password request successfully', async () => {
      const email = 'test@example.com';
      const mockResponse = { message: 'Password reset email sent' };

      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      mockHandleApiResponse.mockReturnValueOnce(mockResponse);

      const result = await authService.forgotPassword(email);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email });
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const token = 'reset-token';
      const newPassword = 'newpassword123';
      const mockResponse = { message: 'Password reset successfully' };

      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      mockHandleApiResponse.mockReturnValueOnce(mockResponse);

      const result = await authService.resetPassword(token, newPassword);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', { token, newPassword });
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwords = { currentPassword: 'oldpass', newPassword: 'newpass' };
      const mockResponse = { message: 'Password changed successfully' };

      mockApiClient.put.mockResolvedValueOnce({ data: mockResponse });
      mockHandleApiResponse.mockReturnValueOnce(mockResponse);

      const result = await authService.changePassword(passwords);

      expect(mockApiClient.put).toHaveBeenCalledWith('/auth/change-password', passwords);
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockResponse = { message: 'Logged out successfully' };

      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      mockHandleApiResponse.mockReturnValueOnce(mockResponse);

      const result = await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockHandleApiResponse).toHaveBeenCalledWith({ data: mockResponse });
      expect(result).toEqual(mockResponse);
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('should clear token even if logout fails', async () => {
      const error = new Error('Network error');

      mockApiClient.post.mockRejectedValueOnce(error);
      mockHandleApiError.mockImplementationOnce(() => {
        throw error;
      });

      await expect(authService.logout()).rejects.toThrow('Network error');
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      (localStorage.getItem as jest.Mock).mockReturnValueOnce('mock-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      (localStorage.getItem as jest.Mock).mockReturnValueOnce(null);
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token when it exists', () => {
      (localStorage.getItem as jest.Mock).mockReturnValueOnce('mock-token');
      expect(authService.getToken()).toBe('mock-token');
    });

    it('should return null when token does not exist', () => {
      (localStorage.getItem as jest.Mock).mockReturnValueOnce(null);
      expect(authService.getToken()).toBe(null);
    });
  });
}); 