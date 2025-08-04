const API_BASE_URL = 'https://yap-nest-pa3xjusm2-berkans-projects-d2fa45cc.vercel.app';
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  const response = await fetch(url, config);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};
export const notificationService = {
  async getUserNotifications(): Promise<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>> {
    return apiRequest('/notifications');
  },
  async markAsRead(notificationId: string): Promise<void> {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },
  async markAllAsRead(): Promise<void> {
    return apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  },
  async getUnreadCount(): Promise<number> {
    return apiRequest('/notifications/unread-count');
  },
};