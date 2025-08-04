import apiClient, { handleApiResponse, handleApiError } from '../api';
import { HealthResponse } from '@/lib/types';

export const utilityService = {
  // Sağlık kontrolü
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await apiClient.get<HealthResponse>('/health');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Swagger dokümantasyonu URL'ini getir
  getSwaggerUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://yap-nest-axplyzlx3-berkans-projects-d2fa45cc.vercel.app';
    return `${baseUrl}/api`;
  },
}; 