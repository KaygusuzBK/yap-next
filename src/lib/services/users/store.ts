import { create } from 'zustand';
import { User } from '@/lib/types';
import { userService } from './api';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await userService.getAllUsers();
      set({ users, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));