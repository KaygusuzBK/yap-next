import { create } from 'zustand';
import { Project } from '@/lib/types';
import { projectService } from './api';

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  loading: false,
  error: null,
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await projectService.getAllProjects();
      set({ projects, loading: false });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Bilinmeyen hata', loading: false });
    }
  },
}));