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
          login: async (email, password, rememberMe = false) => {
          set({ loading: true, error: null });
          try {
            const response = await authService.login({ email, password, rememberMe });
            set({ user: response.user, loading: false });
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Bilinmeyen hata', loading: false });
          }
        },
  logout: () => {
    authService.logout();
    set({ user: null });
  },
          fetchCurrentUser: async () => {
          set({ loading: true });
          try {
            const user = await authService.getProfile();
            set({ user, loading: false });
          } catch {
            set({ user: null, loading: false });
          }
        },
}));