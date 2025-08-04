// User Entity
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Hidden in responses
  avatar?: string;
  role: 'admin' | 'manager' | 'member';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Project Entity
export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate: string;
  endDate?: string;
  budget?: number;
  progress: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  owner?: User;
  tasks?: Task[];
  comments?: Comment[];
  files?: File[];
}

// Task Entity
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  projectId: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours: number;
  parentTaskId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  // Relations
  assignee?: User;
  project?: Project;
  parentTask?: Task;
  subtasks?: Task[];
  comments?: Comment[];
  files?: File[];
}

// Comment Entity
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  taskId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  author?: User;
  task?: Task;
  project?: Project;
}

// File Entity
export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  taskId?: string;
  projectId?: string;
  uploadedById: string;
  createdAt: string;
  // Relations
  task?: Task;
  project?: Project;
  uploadedBy?: User;
}

// Notification Entity
export interface Notification {
  id: string;
  type: 'task_assigned' | 'comment_added' | 'task_completed' | 'project_updated' | 'deadline_approaching' | 'file_uploaded';
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  relatedTaskId?: string;
  relatedProjectId?: string;
  createdAt: string;
  // Relations
  user?: User;
}

// Dashboard Stats
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

// Filter Options
export interface FilterOptions {
  status?: string;
  priority?: string;
  assigneeId?: string;
  projectId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Sort Options
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// API Response Types
export interface AuthResponse {
  user: User;
  token: string;
  tokenType: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: 'admin' | 'manager' | 'member';
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  token: string;
  newPassword: string;
}

export interface CreateProjectForm {
  title: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate: string;
  endDate?: string;
  budget?: number;
  progress?: number;
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  projectId: string;
  dueDate?: string;
  estimatedHours?: number;
  parentTaskId?: string;
  tags?: string[];
}

export interface CreateCommentForm {
  content: string;
  taskId?: string;
  projectId?: string;
} 