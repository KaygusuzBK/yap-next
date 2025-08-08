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


