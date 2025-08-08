"use client";

import { getSupabase } from '@/lib/supabase';

export type Team = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export async function fetchTeams(): Promise<Team[]> {
  const supabase = getSupabase();
  // Visible via RLS only if current user is a member
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTeam(input: { name: string }): Promise<Team> {
  const supabase = getSupabase();
  // 1) create team with owner_id = auth.uid()
  const user = (await supabase.auth.getUser()).data.user;
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({ name: input.name, owner_id: user?.id })
    .select('*')
    .single();
  if (teamErr) throw teamErr;
  return team as Team;
}

export async function inviteToTeam(input: { team_id: string; email: string; role?: string }) {
  const supabase = getSupabase();
  const token = crypto.randomUUID();
  const { data, error } = await supabase
    .from('team_invitations')
    .insert({ team_id: input.team_id, email: input.email, role: input.role ?? 'member', token })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeamName(input: { team_id: string; name: string }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('teams')
    .update({ name: input.name })
    .eq('id', input.team_id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Team;
}

export async function deleteTeam(team_id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', team_id);
  if (error) throw error;
}


export async function setTeamPrimaryProject(input: { team_id: string; project_id: string | null }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('teams')
    .update({ primary_project_id: input.project_id })
    .eq('id', input.team_id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Team;
}


