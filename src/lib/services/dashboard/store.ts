import { create } from 'zustand';
import { DashboardStats } from '@/lib/types';
import { dashboardService } from './api';

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await dashboardService.getDashboardStats();
      set({ stats, loading: false });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Bilinmeyen hata', loading: false });
    }
  },
}));