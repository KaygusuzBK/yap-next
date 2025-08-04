import { create } from 'zustand';

interface FileMeta {
  id: string;
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

interface FileState {
  files: FileMeta[];
  loading: boolean;
  error: string | null;
  fetchFilesByTask: (taskId: string) => Promise<void>;
}

import { fileService } from './api';

export const useFileStore = create<FileState>((set) => ({
  files: [],
  loading: false,
  error: null,
  fetchFilesByTask: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const files = await fileService.getFilesByTask(taskId);
      set({ files, loading: false });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Bilinmeyen hata', loading: false });
    }
  },
}));