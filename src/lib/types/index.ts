// Kullanıcı tipleri
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'project_leader' | 'team_member';
  createdAt: string;
  lastActive: string;
}

// Proje tipleri
export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  startDate: string;
  endDate: string;
  budget?: number;
  progress: number;
  ownerId: string;
  teamMembers: string[];
  createdAt: string;
  updatedAt: string;
}

// Görev tipleri
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  projectId: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
  dependencies: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Yorum tipleri
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  taskId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

// Dosya tipleri
export interface File {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  taskId?: string;
  projectId?: string;
  uploadedBy: string;
  createdAt: string;
}

// Bildirim tipleri
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId: string;
  read: boolean;
  relatedId?: string;
  relatedType?: 'task' | 'project' | 'comment';
  createdAt: string;
}

// Dashboard istatistikleri
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
  totalHours: number;
}

// Filtreleme ve sıralama tipleri
export interface FilterOptions {
  status?: string[];
  priority?: string[];
  assignee?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
} 