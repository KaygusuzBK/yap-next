import { db, supabase } from '@/lib/supabase';
import { Project, ProjectStats, CreateProjectRequest, UpdateProjectRequest } from '@/lib/types';

export const projectService = {
  // Tüm projeleri getir
  async getAllProjects(): Promise<Project[]> {
    try {
      const projects = await db.getProjects();
      return projects.map((project: any) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        startDate: project.start_date,
        endDate: project.end_date,
        budget: project.budget,
        progress: project.progress,
        ownerId: project.owner_id,
        priority: project.priority || 'medium',
        tags: project.tags || [],
        color: project.color || '#3b82f6',
        isPublic: project.is_public || false,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Projeyi ID ile getir
  async getProjectById(id: string): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        budget: data.budget,
        progress: data.progress,
        ownerId: data.owner_id,
        priority: data.priority || 'medium',
        tags: data.tags || [],
        color: data.color || '#3b82f6',
        isPublic: data.is_public || false,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Yeni proje oluştur
  async createProject(project: CreateProjectRequest): Promise<Project> {
    try {
      const projectData = {
        title: project.title,
        description: project.description,
        status: 'active',
        start_date: project.startDate,
        end_date: project.endDate,
        budget: project.budget,
        progress: project.progress || 0,
        priority: project.priority || 'medium',
        tags: project.tags || [],
        color: project.color || '#3b82f6',
        is_public: project.isPublic || false
      };
      const newProject = await db.createProject(projectData);
      return {
        ...newProject,
        startDate: newProject.start_date,
        endDate: newProject.end_date,
        ownerId: newProject.owner_id,
        priority: newProject.priority || 'medium',
        tags: newProject.tags || [],
        color: newProject.color || '#3b82f6',
        isPublic: newProject.is_public || false,
        createdAt: newProject.created_at,
        updatedAt: newProject.updated_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Proje güncelle
  async updateProject(id: string, updates: UpdateProjectRequest): Promise<Project> {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
      if (updates.budget !== undefined) updateData.budget = updates.budget;
      if (updates.progress !== undefined) updateData.progress = updates.progress;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;

      const updatedProject = await db.updateProject(id, updateData);
      
      return {
        id: updatedProject.id,
        title: updatedProject.title,
        description: updatedProject.description,
        status: updatedProject.status,
        startDate: updatedProject.start_date,
        endDate: updatedProject.end_date,
        budget: updatedProject.budget,
        progress: updatedProject.progress,
        ownerId: updatedProject.owner_id,
        priority: updatedProject.priority || 'medium',
        tags: updatedProject.tags || [],
        color: updatedProject.color || '#3b82f6',
        isPublic: updatedProject.is_public || false,
        createdAt: updatedProject.created_at,
        updatedAt: updatedProject.updated_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Proje sil
  async deleteProject(id: string): Promise<{ message: string }> {
    try {
      await db.deleteProject(id);
      return { message: 'Proje başarıyla silindi' };
    } catch (error) {
      throw error;
    }
  },

  // Proje istatistikleri
  async getProjectStats(): Promise<ProjectStats> {
    try {
      const projects = await db.getProjects();
      
      const total = projects.length;
      const active = projects.filter((p: any) => p.status === 'active').length;
      const completed = projects.filter((p: any) => p.status === 'completed').length;
      const cancelled = projects.filter((p: any) => p.status === 'cancelled').length;
      
      return {
        total,
        active,
        completed,
        cancelled,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    } catch (error) {
      throw error;
    }
  },

  // Durum bazında projeleri getir
  async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((project: any) => ({
        ...project,
        startDate: project.start_date,
        endDate: project.end_date,
        ownerId: project.owner_id,
        priority: project.priority || 'medium',
        tags: project.tags || [],
        color: project.color || '#3b82f6',
        isPublic: project.is_public || false,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Sahip bazında projeleri getir
  async getProjectsByOwner(ownerId: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((project: any) => ({
        ...project,
        startDate: project.start_date,
        endDate: project.end_date,
        ownerId: project.owner_id,
        priority: project.priority || 'medium',
        tags: project.tags || [],
        color: project.color || '#3b82f6',
        isPublic: project.is_public || false,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Öncelik bazında projeleri getir
  async getProjectsByPriority(priority: Project['priority']): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('priority', priority)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((project: any) => ({
        ...project,
        startDate: project.start_date,
        endDate: project.end_date,
        ownerId: project.owner_id,
        priority: project.priority || 'medium',
        tags: project.tags || [],
        color: project.color || '#3b82f6',
        isPublic: project.is_public || false,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Tag bazında projeleri getir
  async getProjectsByTag(tag: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .contains('tags', [tag])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((project: any) => ({
        ...project,
        startDate: project.start_date,
        endDate: project.end_date,
        ownerId: project.owner_id,
        priority: project.priority || 'medium',
        tags: project.tags || [],
        color: project.color || '#3b82f6',
        isPublic: project.is_public || false,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Arama yap
  async searchProjects(query: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((project: any) => ({
        ...project,
        startDate: project.start_date,
        endDate: project.end_date,
        ownerId: project.owner_id,
        priority: project.priority || 'medium',
        tags: project.tags || [],
        color: project.color || '#3b82f6',
        isPublic: project.is_public || false,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }
};