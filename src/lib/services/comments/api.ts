import apiClient, { handleApiResponse, handleApiError } from '../api';
import { Comment, CreateCommentRequest } from '@/lib/types';

export const commentService = {
  // Görev için yorumları getir
  async getCommentsByTask(taskId: string): Promise<Comment[]> {
    try {
      const response = await apiClient.get<Comment[]>(`/comments?taskId=${taskId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Proje için yorumları getir
  async getCommentsByProject(projectId: string): Promise<Comment[]> {
    try {
      const response = await apiClient.get<Comment[]>(`/comments?projectId=${projectId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Yorumu ID ile getir
  async getCommentById(id: string): Promise<Comment> {
    try {
      const response = await apiClient.get<Comment>(`/comments/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Yeni yorum oluştur
  async createComment(comment: CreateCommentRequest): Promise<Comment> {
    try {
      const response = await apiClient.post<Comment>('/comments', comment);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Yorum güncelle
  async updateComment(id: string, updates: Partial<Comment>): Promise<Comment> {
    try {
      const response = await apiClient.put<Comment>(`/comments/${id}`, updates);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Yorum sil
  async deleteComment(id: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/comments/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Kullanıcının yorumlarını getir
  async getCommentsByUser(userId: string): Promise<Comment[]> {
    try {
      const response = await apiClient.get<Comment[]>(`/comments?userId=${userId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Yorumu beğen/beğenme
  async toggleCommentLike(id: string): Promise<Comment> {
    try {
      const response = await apiClient.post<Comment>(`/comments/${id}/like`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Yanıt yorumu oluştur
  async createReply(parentId: string, comment: CreateCommentRequest): Promise<Comment> {
    try {
      const response = await apiClient.post<Comment>(`/comments/${parentId}/replies`, comment);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Yanıt yorumlarını getir
  async getReplies(parentId: string): Promise<Comment[]> {
    try {
      const response = await apiClient.get<Comment[]>(`/comments/${parentId}/replies`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },
};