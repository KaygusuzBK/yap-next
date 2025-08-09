"use client";

import { getSupabase } from '@/lib/supabase';

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  project_title?: string;
};

export async function fetchTasksByProject(projectId: string): Promise<Task[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyTasks(): Promise<Task[]> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  type SupabaseTaskRow = {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    status: Task['status'];
    priority: Task['priority'];
    assigned_to: string | null;
    created_by: string;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    projects?: { title?: string } | null;
  };

  const { data, error } = await supabase
    .from('project_tasks')
    .select(`*, projects(title)`) // join for project title
    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data as SupabaseTaskRow[] | null ?? []).map((row) => ({
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigned_to: row.assigned_to,
    created_by: row.created_by,
    due_date: row.due_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    project_title: row.projects?.title,
  })) as Task[];
}

export async function createTask(input: {
  project_id: string;
  title: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'review' | 'completed';
  due_date?: string | null;
}): Promise<Task> {
  const supabase = getSupabase();
  
  // Mevcut kullanıcıyı al
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

  const { data, error } = await supabase
    .from('project_tasks')
    .insert({
      project_id: input.project_id,
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'medium',
      status: input.status || 'todo',
      due_date: input.due_date || null,
      created_by: user.id,
    })
    .select('*')
    .single();
    
  if (error) throw error;
  return data as Task;
}

export async function assignTaskToUser(taskId: string, userId: string): Promise<void> {
  const supabase = getSupabase();
  
  // Mevcut kullanıcıyı al
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

  // Görevi güncelle
  const { error: updateError } = await supabase
    .from('project_tasks')
    .update({ assigned_to: userId })
    .eq('id', taskId);
    
  if (updateError) throw updateError;

  // Atama kaydı oluştur
  const { error: assignmentError } = await supabase
    .from('task_assignments')
    .insert({
      task_id: taskId,
      user_id: userId,
      assigned_by: user.id,
    });
    
  if (assignmentError) throw assignmentError;
}

export async function unassignTask(taskId: string): Promise<void> {
  const supabase = getSupabase();
  
  // Görevi güncelle
  const { error: updateError } = await supabase
    .from('project_tasks')
    .update({ assigned_to: null })
    .eq('id', taskId);
    
  if (updateError) throw updateError;

  // Atama kayıtlarını sil
  const { error: deleteError } = await supabase
    .from('task_assignments')
    .delete()
    .eq('task_id', taskId);
    
  if (deleteError) throw deleteError;
}

export async function getProjectMembers(projectId: string): Promise<Array<{ id: string; email: string; name?: string }>> {
  const supabase = getSupabase();
  
  // Proje üyelerini al
  const { data: projectMembers, error: projectError } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId);
    
  if (projectError) throw projectError;

  if (!projectMembers || projectMembers.length === 0) {
    return [];
  }

  const userIds = projectMembers.map(pm => pm.user_id);
  
  // Kullanıcı bilgilerini al
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);
    
  if (usersError) throw usersError;

  return users?.map(user => ({
    id: user.id,
    email: user.email,
    name: user.full_name || user.email.split('@')[0]
  })) || [];
}

export async function updateTask(input: {
  id: string;
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'review' | 'completed';
  assigned_to?: string | null;
  due_date?: string | null;
}): Promise<Task> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('project_tasks')
    .update({
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      assigned_to: input.assigned_to,
      due_date: input.due_date,
    })
    .eq('id', input.id)
    .select('*')
    .single();
    
  if (error) throw error;
  return data as Task;
}

export async function fetchTaskById(taskId: string): Promise<Task> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('project_tasks')
    .select(`
      *,
      projects!inner(title)
    `)
    .eq('id', taskId)
    .single();
    
  if (error) throw error;
  
  return {
    ...data,
    project_title: data.projects?.title || 'Bilinmeyen Proje'
  } as Task;
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = getSupabase();
  
  // Mevcut kullanıcıyı al
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

  // İlişkili kayıtları sil
  const { error: assignmentsError } = await supabase
    .from('task_assignments')
    .delete()
    .eq('task_id', taskId);
    
  if (assignmentsError) throw assignmentsError;

  const { error: commentsError } = await supabase
    .from('task_comments')
    .delete()
    .eq('task_id', taskId);
    
  if (commentsError) throw commentsError;

  const { error: timeLogsError } = await supabase
    .from('task_time_logs')
    .delete()
    .eq('task_id', taskId);
    
  if (timeLogsError) throw timeLogsError;

  const { error: filesError } = await supabase
    .from('task_files')
    .delete()
    .eq('task_id', taskId);
    
  if (filesError) throw filesError;

  const { error: activitiesError } = await supabase
    .from('task_activities')
    .delete()
    .eq('task_id', taskId);
    
  if (activitiesError) throw activitiesError;

  // Ana görevi sil
  const { error: taskError } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', taskId);
    
  if (taskError) throw taskError;
}


