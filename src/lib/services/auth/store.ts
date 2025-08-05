import { create } from 'zustand';
import { authService } from './api';
import { User, LoginRequest, RegisterRequest } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  login: async (credentials: LoginRequest) => {
    try {
      set({ loading: true, error: null });
      
      const response = await authService.login(credentials);
      
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Giriş yapılırken hata oluştu', 
        loading: false 
      });
      throw error;
    }
  },

  register: async (userData: RegisterRequest) => {
    try {
      set({ loading: true, error: null });
      
      const response = await authService.register(userData);
      
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Kayıt olurken hata oluştu', 
        loading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      
      await authService.logout();
      
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false 
      });
    } catch (error: any) {
      // Logout hatası olsa bile state'i temizle
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: error.message || 'Çıkış yapılırken hata oluştu'
      });
    }
  },

  fetchCurrentUser: async () => {
    try {
      set({ loading: true });
      
      const user = await authService.getProfile();
      
      set({ 
        user, 
        isAuthenticated: true, 
        loading: false 
      });
    } catch (error: any) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: error.message || 'Kullanıcı bilgileri alınamadı'
      });
    }
  },

  checkAuth: async () => {
    try {
      set({ loading: true });
      
      // Supabase session kontrolü
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const user = await authService.getProfile();
        set({ 
          user, 
          isAuthenticated: true, 
          loading: false 
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          loading: false 
        });
      }
    } catch (error: any) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: error.message || 'Kimlik doğrulama kontrolü başarısız'
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));

// Supabase auth state listener
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    const { checkAuth } = useAuthStore.getState();
    
    if (event === 'SIGNED_IN' && session) {
      await checkAuth();
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ 
        user: null, 
        isAuthenticated: false 
      });
    }
  });
}