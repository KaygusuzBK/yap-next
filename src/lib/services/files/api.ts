const API_BASE_URL = 'https://yap-nest-pa3xjusm2-berkans-projects-d2fa45cc.vercel.app';
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
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
export const fileService = {
  async uploadFile(file: File, taskId?: string, projectId?: string): Promise<{
    id: string;
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    if (taskId) formData.append('taskId', taskId);
    if (projectId) formData.append('projectId', projectId);
    const url = `${API_BASE_URL}/files/upload`;
    const token = localStorage.getItem('authToken');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
    return response.json();
  },
  async getFilesByTask(taskId: string): Promise<Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
  }>> {
    return apiRequest(`/files?taskId=${taskId}`);
  },
  async getFilesByProject(projectId: string): Promise<Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
  }>> {
    return apiRequest(`/files?projectId=${projectId}`);
  },
  async deleteFile(fileId: string): Promise<void> {
    return apiRequest(`/files/${fileId}`, {
      method: 'DELETE',
    });
  },
};