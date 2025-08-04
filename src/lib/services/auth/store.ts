import { create } from 'zustand';
import { User, LoginRequest, RegisterRequest } from '@/lib/types';
import { authService } from './api';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  login: async (credentials: LoginRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login(credentials);
      set({ 
        user: response.user, 
        loading: false, 
        isAuthenticated: true,
        error: null 
      });
    } catch (error: unknown) {
      set({ 
        error: error instanceof Error ? error.message : 'Bilinmeyen hata', 
        loading: false,
        isAuthenticated: false 
      });
      throw error;
    }
  },

  register: async (userData: RegisterRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.register(userData);
      set({ 
        user: response.user, 
        loading: false, 
        isAuthenticated: true,
        error: null 
      });
    } catch (error: unknown) {
      set({ 
        error: error instanceof Error ? error.message : 'Bilinmeyen hata', 
        loading: false,
        isAuthenticated: false 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await authService.logout();
      set({ user: null, loading: false, isAuthenticated: false, error: null });
    } catch (error: unknown) {
      // Even if logout fails, clear the local state
      set({ user: null, loading: false, isAuthenticated: false, error: null });
    }
  },

  fetchCurrentUser: async () => {
    set({ loading: true });
    try {
      const user = await authService.getProfile();
      set({ user, loading: false, isAuthenticated: true, error: null });
    } catch (error: unknown) {
      set({ user: null, loading: false, isAuthenticated: false, error: null });
    }
  },

  checkAuth: async () => {
    const isAuthenticated = authService.isAuthenticated();
    if (isAuthenticated) {
      await get().fetchCurrentUser();
    } else {
      set({ user: null, isAuthenticated: false, error: null });
    }
  },
}));