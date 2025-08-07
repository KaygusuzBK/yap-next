"use client";

import { getSupabase } from '@/lib/supabase';

export type Task = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchTasksByProject(projectId: string): Promise<Task[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTask(input: { project_id: string; title: string }): Promise<Task> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .insert({ project_id: input.project_id, title: input.title })
    .select('*')
    .single();
  if (error) throw error;
  return data as Task;
}


