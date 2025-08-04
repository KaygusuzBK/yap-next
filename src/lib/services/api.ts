// Demo veriler için API servis katmanı
// Backend entegrasyonu için tek noktadan yönetim

import { User, Project, Task, Comment, File, Notification, DashboardStats } from '@/lib/types';
import { demoUsers, getCurrentUser, getUserById, getUsersByRole } from '@/data/demo/users';
import { demoProjects, getProjectById, getProjectsByStatus, getProjectsByOwner, getProjectsByTeamMember, getActiveProjects, getCompletedProjects } from '@/data/demo/projects';
import { demoTasks, getTaskById, getTasksByProject, getTasksByStatus, getTasksByAssignee, getTasksByPriority, getOverdueTasks, getTasksByTag } from '@/data/demo/tasks';

// Simüle edilmiş API gecikmesi
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Kullanıcı servisleri
export const userService = {
  // Tüm kullanıcıları getir
  async getAllUsers(): Promise<User[]> {
    await delay(300);
    return demoUsers;
  },

  // Kullanıcıyı ID ile getir
  async getUserById(id: string): Promise<User | undefined> {
    await delay(200);
    return getUserById(id);
  },

  // Mevcut kullanıcıyı getir
  async getCurrentUser(): Promise<User> {
    await delay(100);
    return getCurrentUser();
  },

  // Rol bazında kullanıcıları getir
  async getUsersByRole(role: User['role']): Promise<User[]> {
    await delay(250);
    return getUsersByRole(role);
  },

  // Kullanıcı güncelle
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await delay(400);
    const userIndex = demoUsers.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('Kullanıcı bulunamadı');
    }
    demoUsers[userIndex] = { ...demoUsers[userIndex], ...updates };
    return demoUsers[userIndex];
  },
};

// Proje servisleri
export const projectService = {
  // Tüm projeleri getir
  async getAllProjects(): Promise<Project[]> {
    await delay(400);
    return demoProjects;
  },

  // Projeyi ID ile getir
  async getProjectById(id: string): Promise<Project | undefined> {
    await delay(200);
    return getProjectById(id);
  },

  // Durum bazında projeleri getir
  async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    await delay(300);
    return getProjectsByStatus(status);
  },

  // Sahip bazında projeleri getir
  async getProjectsByOwner(ownerId: string): Promise<Project[]> {
    await delay(300);
    return getProjectsByOwner(ownerId);
  },

  // Ekip üyesi bazında projeleri getir
  async getProjectsByTeamMember(memberId: string): Promise<Project[]> {
    await delay(300);
    return getProjectsByTeamMember(memberId);
  },

  // Aktif projeleri getir
  async getActiveProjects(): Promise<Project[]> {
    await delay(250);
    return getActiveProjects();
  },

  // Tamamlanan projeleri getir
  async getCompletedProjects(): Promise<Project[]> {
    await delay(250);
    return getCompletedProjects();
  },

  // Yeni proje oluştur
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    await delay(500);
    const newProject: Project = {
      ...project,
      id: (demoProjects.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoProjects.push(newProject);
    return newProject;
  },

  // Proje güncelle
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    await delay(400);
    const projectIndex = demoProjects.findIndex(project => project.id === id);
    if (projectIndex === -1) {
      throw new Error('Proje bulunamadı');
    }
    demoProjects[projectIndex] = { 
      ...demoProjects[projectIndex], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    return demoProjects[projectIndex];
  },

  // Proje sil
  async deleteProject(id: string): Promise<void> {
    await delay(300);
    const projectIndex = demoProjects.findIndex(project => project.id === id);
    if (projectIndex === -1) {
      throw new Error('Proje bulunamadı');
    }
    demoProjects.splice(projectIndex, 1);
  },
};

// Görev servisleri
export const taskService = {
  // Tüm görevleri getir
  async getAllTasks(): Promise<Task[]> {
    await delay(400);
    return demoTasks;
  },

  // Görevi ID ile getir
  async getTaskById(id: string): Promise<Task | undefined> {
    await delay(200);
    return getTaskById(id);
  },

  // Proje bazında görevleri getir
  async getTasksByProject(projectId: string): Promise<Task[]> {
    await delay(300);
    return getTasksByProject(projectId);
  },

  // Durum bazında görevleri getir
  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    await delay(300);
    return getTasksByStatus(status);
  },

  // Atanan kişi bazında görevleri getir
  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    await delay(300);
    return getTasksByAssignee(assigneeId);
  },

  // Öncelik bazında görevleri getir
  async getTasksByPriority(priority: Task['priority']): Promise<Task[]> {
    await delay(300);
    return getTasksByPriority(priority);
  },

  // Geciken görevleri getir
  async getOverdueTasks(): Promise<Task[]> {
    await delay(250);
    return getOverdueTasks();
  },

  // Tag bazında görevleri getir
  async getTasksByTag(tag: string): Promise<Task[]> {
    await delay(300);
    return getTasksByTag(tag);
  },

  // Yeni görev oluştur
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    await delay(500);
    const newTask: Task = {
      ...task,
      id: (demoTasks.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoTasks.push(newTask);
    return newTask;
  },

  // Görev güncelle
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    await delay(400);
    const taskIndex = demoTasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      throw new Error('Görev bulunamadı');
    }
    demoTasks[taskIndex] = { 
      ...demoTasks[taskIndex], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    return demoTasks[taskIndex];
  },

  // Görev sil
  async deleteTask(id: string): Promise<void> {
    await delay(300);
    const taskIndex = demoTasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      throw new Error('Görev bulunamadı');
    }
    demoTasks.splice(taskIndex, 1);
  },
};

// Dashboard servisleri
export const dashboardService = {
  // Dashboard istatistiklerini getir
  async getDashboardStats(): Promise<DashboardStats> {
    await delay(500);
    const activeProjects = getActiveProjects().length;
    const completedProjects = getCompletedProjects().length;
    const totalTasks = demoTasks.length;
    const completedTasks = demoTasks.filter(task => task.status === 'completed').length;
    const overdueTasks = getOverdueTasks().length;
    const totalHours = demoTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);

    return {
      totalProjects: demoProjects.length,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      teamMembers: demoUsers.length,
      totalHours,
    };
  },

  // Son aktiviteleri getir (simüle edilmiş)
  async getRecentActivities(): Promise<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    userId: string;
  }>> {
    await delay(300);
    return [
      {
        id: '1',
        type: 'task_completed',
        title: 'Frontend Geliştirme tamamlandı',
        description: 'Mehmet Kaya UI/UX tasarımını tamamladı',
        timestamp: new Date().toISOString(),
        userId: '3',
      },
      {
        id: '2',
        type: 'project_created',
        title: 'Yeni proje oluşturuldu',
        description: 'Ayşe Demir yeni bir proje oluşturdu',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: '2',
      },
      {
        id: '3',
        type: 'comment_added',
        title: 'Yeni yorum eklendi',
        description: 'Fatma Özkan bir göreve yorum ekledi',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        userId: '4',
      },
    ];
  },
};

// Yorum servisleri (simüle edilmiş)
export const commentService = {
  async getCommentsByTask(_taskId: string): Promise<Comment[]> {
    await delay(300);
    return []; // Demo veriler için boş array
  },

  async createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    await delay(400);
    const newComment: Comment = {
      ...comment,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newComment;
  },
};

// Dosya servisleri (simüle edilmiş)
export const fileService = {
  async getFilesByTask(_taskId: string): Promise<File[]> {
    await delay(300);
    return []; // Demo veriler için boş array
  },

  async uploadFile(file: File): Promise<File> {
    await delay(1000);
    return file;
  },
};

// Bildirim servisleri (simüle edilmiş)
export const notificationService = {
  async getUserNotifications(_userId: string): Promise<Notification[]> {
    await delay(300);
    return []; // Demo veriler için boş array
  },

  async markAsRead(_notificationId: string): Promise<void> {
    await delay(200);
    // Demo için boş implementasyon
  },
}; 