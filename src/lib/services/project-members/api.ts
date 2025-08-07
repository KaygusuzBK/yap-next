import { supabase } from '@/lib/supabase';
import { ProjectMember, CreateProjectMemberRequest, UpdateProjectMemberRequest } from '@/lib/types';

export const projectMemberService = {
  // Proje üyelerini getir
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          user:users(id, email, raw_user_meta_data),
          invited_by_user:users!project_members_invited_by_fkey(id, email, raw_user_meta_data)
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return data.map((member: any) => ({
        id: member.id,
        projectId: member.project_id,
        userId: member.user_id,
        role: member.role,
        permissions: member.permissions || [],
        invitedBy: member.invited_by,
        isActive: member.is_active,
        joinedAt: member.joined_at,
        user: member.user ? {
          id: member.user.id,
          email: member.user.email,
          name: member.user.raw_user_meta_data?.name || '',
          avatar: member.user.raw_user_meta_data?.avatar || '',
          role: member.user.raw_user_meta_data?.role || 'member',
          isActive: true,
          createdAt: member.user.created_at || new Date().toISOString(),
          updatedAt: member.user.updated_at || new Date().toISOString()
        } : undefined,
        invitedByUser: member.invited_by_user ? {
          id: member.invited_by_user.id,
          email: member.invited_by_user.email,
          name: member.invited_by_user.raw_user_meta_data?.name || '',
          avatar: member.invited_by_user.raw_user_meta_data?.avatar || '',
          role: member.invited_by_user.raw_user_meta_data?.role || 'member',
          isActive: true,
          createdAt: member.invited_by_user.created_at || new Date().toISOString(),
          updatedAt: member.invited_by_user.updated_at || new Date().toISOString()
        } : undefined
      }));
    } catch (error) {
      throw error;
    }
  },

  // Kullanıcının üye olduğu projeleri getir
  async getUserProjects(userId: string): Promise<ProjectMember[]> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return data.map((member: any) => ({
        id: member.id,
        projectId: member.project_id,
        userId: member.user_id,
        role: member.role,
        permissions: member.permissions || [],
        invitedBy: member.invited_by,
        isActive: member.is_active,
        joinedAt: member.joined_at,
        project: member.project ? {
          id: member.project.id,
          title: member.project.title,
          description: member.project.description,
          status: member.project.status,
          startDate: member.project.start_date,
          endDate: member.project.end_date,
          budget: member.project.budget,
          progress: member.project.progress,
          ownerId: member.project.owner_id,
          priority: member.project.priority || 'medium',
          tags: member.project.tags || [],
          color: member.project.color || '#3b82f6',
          isPublic: member.project.is_public || false,
          createdAt: member.project.created_at,
          updatedAt: member.project.updated_at
        } : undefined
      }));
    } catch (error) {
      throw error;
    }
  },

  // Proje üyesi ekle
  async addProjectMember(member: CreateProjectMemberRequest): Promise<ProjectMember> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: member.projectId,
          user_id: member.userId,
          role: member.role,
          permissions: member.permissions || [],
          invited_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        role: data.role,
        permissions: data.permissions || [],
        invitedBy: data.invited_by,
        isActive: data.is_active,
        joinedAt: data.joined_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Proje üyesi güncelle
  async updateProjectMember(id: string, updates: UpdateProjectMemberRequest): Promise<ProjectMember> {
    try {
      const updateData: any = {};
      
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('project_members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        role: data.role,
        permissions: data.permissions || [],
        invitedBy: data.invited_by,
        isActive: data.is_active,
        joinedAt: data.joined_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Proje üyesi sil
  async removeProjectMember(id: string): Promise<{ message: string }> {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { message: 'Proje üyesi başarıyla kaldırıldı' };
    } catch (error) {
      throw error;
    }
  },

  // Kullanıcının proje üyeliğini kontrol et
  async checkUserMembership(projectId: string, userId: string): Promise<ProjectMember | null> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return null;

      return {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        role: data.role,
        permissions: data.permissions || [],
        invitedBy: data.invited_by,
        isActive: data.is_active,
        joinedAt: data.joined_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Proje sahibini getir
  async getProjectOwner(projectId: string): Promise<ProjectMember | null> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          user:users(id, email, raw_user_meta_data)
        `)
        .eq('project_id', projectId)
        .eq('role', 'owner')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return null;

      return {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        role: data.role,
        permissions: data.permissions || [],
        invitedBy: data.invited_by,
        isActive: data.is_active,
        joinedAt: data.joined_at,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          name: data.user.raw_user_meta_data?.name || '',
          avatar: data.user.raw_user_meta_data?.avatar || '',
          role: data.user.raw_user_meta_data?.role || 'member',
          isActive: true,
          createdAt: data.user.created_at || new Date().toISOString(),
          updatedAt: data.user.updated_at || new Date().toISOString()
        } : undefined
      };
    } catch (error) {
      throw error;
    }
  }
}; 