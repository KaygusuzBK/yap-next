import { getSupabaseServer } from './supabaseServer'

export async function isTeamOwner(teamId: string, userId: string): Promise<boolean> {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()
  if (error || !data) return false
  return data.owner_id === userId
}

export async function isTeamMember(teamId: string, userId: string): Promise<boolean> {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return false
  return !!data
}

export async function canEditProject(projectId: string, userId: string): Promise<boolean> {
  const supabase = await getSupabaseServer()
  const { data: proj, error } = await supabase
    .from('projects')
    .select('owner_id, team_id')
    .eq('id', projectId)
    .single()
  if (error || !proj) return false
  if (proj.owner_id === userId) return true
  if (proj.team_id) return isTeamMember(proj.team_id, userId)
  return false
}


