"use client";

import { getSupabase } from '@/lib/supabase';

export type Project = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  team_id: string | null;
  status: 'active' | 'archived' | 'completed';
  created_at: string;
  updated_at: string;
  slack_channel_id?: string | null;
};

export async function fetchProjects(): Promise<Project[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProject(input: { title: string; description?: string | null; team_id?: string | null }): Promise<Project> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  const { data, error } = await supabase
    .from('projects')
    .insert({ 
      title: input.title, 
      description: input.description ?? null, 
      team_id: input.team_id ?? null,
      owner_id: user.id,
      status: 'active'
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(input: { id: string; title?: string; description?: string | null; team_id?: string | null; status?: 'active' | 'archived' | 'completed' }): Promise<Project> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  // Kullanıcının bu projeyi düzenleme yetkisi olup olmadığını kontrol et
  const { data: existingProject } = await supabase
    .from('projects')
    .select('owner_id, team_id')
    .eq('id', input.id)
    .single();
  
  if (!existingProject) throw new Error('Proje bulunamadı');
  
  // Proje sahibi veya takım üyesi olup olmadığını kontrol et
  const isOwner = existingProject.owner_id === user.id;
  const isTeamMember = existingProject.team_id ? await checkTeamMembership(existingProject.team_id, user.id) : false;
  
  if (!isOwner && !isTeamMember) {
    throw new Error('Bu projeyi düzenleme yetkiniz yok');
  }
  
  const { data, error } = await supabase
    .from('projects')
    .update({
      title: input.title,
      description: input.description,
      team_id: input.team_id,
      status: input.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', input.id)
    .select('*')
    .single();
  
  if (error) throw error;
  return data as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  // Kullanıcının bu projeyi silme yetkisi olup olmadığını kontrol et
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single();
  
  if (!project) throw new Error('Proje bulunamadı');
  
  if (project.owner_id !== user.id) {
    throw new Error('Bu projeyi silme yetkiniz yok');
  }
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  
  if (error) throw error;
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  if (error) return null;
  return data as Project;
}

export async function updateProjectSlackChannel(input: { id: string; slack_channel_id: string | null }): Promise<Project> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');

  const { data, error } = await supabase
    .from('projects')
    .update({ slack_channel_id: input.slack_channel_id, updated_at: new Date().toISOString() })
    .eq('id', input.id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Project;
}

// Helper function to check team membership
async function checkTeamMembership(teamId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single();
  
  return !!data;
}


