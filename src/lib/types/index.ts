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
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId: string;
  projectId: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
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

// Project Stats (from API)
export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

// Task Stats (from API)
export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  completionRate: number;
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

// Authentication Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  tokenType: string;
  expiresIn: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: 'admin' | 'manager' | 'member';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Project Request/Response Types
export interface CreateProjectRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  progress?: number;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate?: string;
  endDate?: string;
  budget?: number;
  progress?: number;
}

// Task Request/Response Types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId: string;
  assigneeId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  estimatedHours?: number;
  parentTaskId?: string;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

// Comment Request/Response Types
export interface CreateCommentRequest {
  content: string;
  taskId?: string;
  projectId?: string;
}

// Utility Types
export interface HealthResponse {
  status: string;
  timestamp: string;
}

// Form Types (keeping for backward compatibility)
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
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
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