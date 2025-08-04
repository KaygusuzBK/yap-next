import { create } from 'zustand';
import { User } from '@/lib/types';
import { authService } from './api';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await authService.login({ email, password });
      const user = await authService.getCurrentUser();
      set({ user, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  logout: () => {
    authService.logout();
    set({ user: null });
  },
  fetchCurrentUser: async () => {
    set({ loading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));