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

// Project Entity (Updated with new fields)
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
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  color: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  owner?: User;
  tasks?: Task[];
  comments?: Comment[];
  files?: ProjectFile[];
  members?: ProjectMember[];
  activities?: ProjectActivity[];
}

// Task Entity (Updated with new fields)
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  projectId: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
  tags?: string[];
  color: string;
  isRecurring: boolean;
  recurringPattern?: string;
  recurringEndDate?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  assignee?: User;
  project?: Project;
  parentTask?: Task;
  subtasks?: Task[];
  comments?: Comment[];
  files?: ProjectFile[];
  assignments?: TaskAssignment[];
  timeLogs?: TaskTimeLog[];
}

// Comment Entity (Updated with new fields)
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  taskId?: string;
  projectId?: string;
  parentCommentId?: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  author?: User;
  task?: Task;
  project?: Project;
  parentComment?: Comment;
  replies?: Comment[];
}

// Project Member Entity (New)
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'manager' | 'member' | 'viewer';
  permissions?: string[];
  invitedBy?: string;
  isActive: boolean;
  joinedAt: string;
  // Relations
  project?: Project;
  user?: User;
  invitedByUser?: User;
}

// Task Assignment Entity (New)
export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: string;
  assignedBy?: string;
  isPrimary: boolean;
  // Relations
  task?: Task;
  user?: User;
  assignedByUser?: User;
}

// Project File Entity (Updated)
export interface ProjectFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  projectId?: string;
  taskId?: string;
  uploadedById: string;
  isPublic: boolean;
  createdAt: string;
  // Relations
  project?: Project;
  task?: Task;
  uploadedBy?: User;
}

// Task Time Log Entity (New)
export interface TaskTimeLog {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  description?: string;
  createdAt: string;
  // Relations
  task?: Task;
  user?: User;
}

// Project Activity Entity (New)
export interface ProjectActivity {
  id: string;
  projectId: string;
  taskId?: string;
  userId: string;
  activityType: string;
  description: string;
  metadata?: any;
  createdAt: string;
  // Relations
  project?: Project;
  task?: Task;
  user?: User;
}

// User Preferences Entity (New)
export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  emailNotifications: {
    projectUpdates: boolean;
    taskAssignments: boolean;
    dueDateReminders: boolean;
  };
  dashboardLayout?: any;
  createdAt: string;
  updatedAt: string;
  // Relations
  user?: User;
}

// Notification Entity (Updated)
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  projectId?: string;
  taskId?: string;
  actionUrl?: string;
  createdAt: string;
  // Relations
  user?: User;
  project?: Project;
  task?: Task;
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
  tags?: string[];
  isPublic?: boolean;
  isRecurring?: boolean;
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

// Project Request/Response Types (Updated)
export interface CreateProjectRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  progress?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  color?: string;
  isPublic?: boolean;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate?: string;
  endDate?: string;
  budget?: number;
  progress?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  color?: string;
  isPublic?: boolean;
}

// Task Request/Response Types (Updated)
export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  estimatedHours?: number;
  parentTaskId?: string;
  tags?: string[];
  color?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringEndDate?: string;
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
  color?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringEndDate?: string;
}

// Comment Request/Response Types (Updated)
export interface CreateCommentRequest {
  content: string;
  taskId?: string;
  projectId?: string;
  parentCommentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// Project Member Request/Response Types (New)
export interface CreateProjectMemberRequest {
  projectId: string;
  userId: string;
  role: 'manager' | 'member' | 'viewer';
  permissions?: string[];
}

export interface UpdateProjectMemberRequest {
  role?: 'manager' | 'member' | 'viewer';
  permissions?: string[];
  isActive?: boolean;
}

// Task Assignment Request/Response Types (New)
export interface CreateTaskAssignmentRequest {
  taskId: string;
  userId: string;
  isPrimary?: boolean;
}

// Time Log Request/Response Types (New)
export interface CreateTimeLogRequest {
  taskId: string;
  description?: string;
}

export interface UpdateTimeLogRequest {
  endTime?: string;
  description?: string;
}

// User Preferences Request/Response Types (New)
export interface UpdateUserPreferencesRequest {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  emailNotifications?: {
    projectUpdates?: boolean;
    taskAssignments?: boolean;
    dueDateReminders?: boolean;
  };
  dashboardLayout?: any;
}

// Notification Request/Response Types (New)
export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  projectId?: string;
  taskId?: string;
  actionUrl?: string;
}

export interface UpdateNotificationRequest {
  isRead?: boolean;
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
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  color?: string;
  isPublic?: boolean;
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
  color?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringEndDate?: string;
}

export interface CreateCommentForm {
  content: string;
  taskId?: string;
  projectId?: string;
  parentCommentId?: string;
} 