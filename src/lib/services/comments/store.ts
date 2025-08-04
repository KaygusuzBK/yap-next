import { create } from 'zustand';
import { Comment } from '@/lib/types';
import { commentService } from './api';

interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  fetchCommentsByTask: (taskId: string) => Promise<void>;
}

export const useCommentStore = create<CommentState>((set) => ({
  comments: [],
  loading: false,
  error: null,
  fetchCommentsByTask: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const comments = await commentService.getCommentsByTask(taskId);
      set({ comments, loading: false });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Bilinmeyen hata', loading: false });
    }
  },
}));