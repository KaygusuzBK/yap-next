import { create } from 'zustand';
import { Task } from '@/lib/types';
import { taskService } from './api';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,
  error: null,
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskService.getAllTasks();
      set({ tasks, loading: false });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Bilinmeyen hata', loading: false });
    }
  },
}));