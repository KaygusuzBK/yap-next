import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/lib/services/auth/store';
import { authService } from '@/lib/services/auth/api';

// Mock the auth service
jest.mock('@/lib/services/auth/api', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    getProfile: jest.fn(),
    isAuthenticated: jest.fn(),
    getToken: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const { result } = renderHook(() => useAuthStore());
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'mock-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      mockAuthService.login.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.login(credentials);
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(credentials);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login error', async () => {
      const { result } = renderHook(() => useAuthStore());
      const credentials = { email: 'test@example.com', password: 'wrong-password' };
      const error = new Error('Invalid credentials');

      mockAuthService.login.mockRejectedValueOnce(error);

      await act(async () => {
        await expect(result.current.login(credentials)).rejects.toThrow('Invalid credentials');
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(credentials);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const { result } = renderHook(() => useAuthStore());
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

      mockAuthService.register.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.register(userData);
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      // First login to set up state
      const mockResponse = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'mock-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };
      mockAuthService.login.mockResolvedValueOnce(mockResponse);
      
      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      // Now logout
      mockAuthService.logout.mockResolvedValueOnce({ message: 'Logged out successfully' });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('fetchCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      mockAuthService.getProfile.mockResolvedValueOnce(mockUser);

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      expect(mockAuthService.getProfile).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle fetch error', async () => {
      const { result } = renderHook(() => useAuthStore());
      const error = new Error('Failed to fetch user');

      mockAuthService.getProfile.mockRejectedValueOnce(error);

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      expect(mockAuthService.getProfile).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should check authentication and fetch user if authenticated', async () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      mockAuthService.getProfile.mockResolvedValueOnce(mockUser);

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
      expect(mockAuthService.getProfile).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should not fetch user if not authenticated', async () => {
      const { result } = renderHook(() => useAuthStore());

      mockAuthService.isAuthenticated.mockReturnValueOnce(false);

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
      expect(mockAuthService.getProfile).not.toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('state management', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it('should update loading state during login', async () => {
      const { result } = renderHook(() => useAuthStore());
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'mock-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      mockAuthService.login.mockResolvedValueOnce(mockResponse);

      // Check initial loading state
      expect(result.current.loading).toBe(false);

      // Perform login
      await act(async () => {
        await result.current.login(credentials);
      });

      // Check final loading state
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockResponse.user);
    });
  });
}); 