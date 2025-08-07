"use client";

import { getSupabase } from '@/lib/supabase';

export type Project = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchProjects(): Promise<Project[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProject(input: { title: string; description?: string | null }): Promise<Project> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('projects')
    .insert({ title: input.title, description: input.description ?? null, owner_id: (await supabase.auth.getUser()).data.user?.id })
    .select('*')
    .single();
  if (error) throw error;
  return data as Project;
}


