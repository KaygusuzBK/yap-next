"use client";

import { getSupabase } from '@/lib/supabase';
import { getUserCached } from '@/lib/auth-cache';

export type TeamRole = 'owner' | 'admin' | 'member';

export type Team = {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  primary_project_id?: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
  project_count?: number;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  email: string | null;
  name: string | null;
  role: TeamRole;
  joined_at: string;
  avatar_url?: string | null;
  is_online?: boolean;
};

export type TeamInvitation = {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'expired';
};

export type TeamStats = {
  member_count: number;
  project_count: number;
  active_task_count: number;
  completed_task_count: number;
};

export async function getTeamById(team_id: string): Promise<Team | null> {
  const supabase = getSupabase();
  
  try {
    console.log('🔍 getTeamById - Starting for team:', team_id);
    
    const { data, error, count } = await supabase
      .from('teams')
      .select('*', { count: 'exact' })
      .eq('id', team_id)
      .maybeSingle();

    console.log('📊 getTeamById - Result:', { 
      count, 
      error,
      data: data ? 'found' : 'not found'
    });

    if (error) {
      console.error('❌ getTeamById - Error:', error);
      throw error;
    }
    
    return (data as Team) ?? null;
  } catch (error) {
    console.error('❌ getTeamById - Exception:', error);
    throw error;
  }
}

export async function getUserRoleForTeam(team_id: string): Promise<TeamRole | null> {
  const supabase = getSupabase();
  const user = await getUserCached();
  if (!user) return null;

  // Owner kontrolü
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', team_id)
    .maybeSingle();

  if (team?.owner_id === user.id) return 'owner';

  // Üyelik kontrolü
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', team_id)
    .eq('user_id', user.id)
    .maybeSingle();

  return (membership?.role as TeamRole) ?? null;
}

export async function fetchTeamAuthorized(team_id: string): Promise<{ team: Team | null; role: TeamRole | null }> {
  const [team, role] = await Promise.all([
    getTeamById(team_id),
    getUserRoleForTeam(team_id),
  ]);
  if (!team || !role) return { team: null, role: null };
  return { team, role };
}

export async function fetchTeams(): Promise<Team[]> {
  const supabase = getSupabase();
  
  try {
    console.log('🔍 fetchTeams - Starting...');
    const user = await getUserCached();
    if (!user) {
      console.error('❌ fetchTeams - No user found');
      return [];
    }
    
    console.log('🔍 fetchTeams - User ID:', user.id);

    // 1) Sahibi olduğu takımlar
    console.log('🔍 fetchTeams - Fetching owned teams...');
    const { data: owned, error: ownedErr, count: ownedCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact' })
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    
    console.log('📊 fetchTeams - Owned teams result:', { 
      count: ownedCount, 
      error: ownedErr,
      data: owned?.length || 0
    });
    
    if (ownedErr) {
      console.error('❌ fetchTeams - Owned teams error:', ownedErr);
    }

    // 2) Üye olduğu takımların id listesini çek (RLS daha stabil)
    console.log('🔍 fetchTeams - Fetching member teams...');
    const { data: memberRows, error: memberErr, count: memberCount } = await supabase
      .from('team_members')
      .select('team_id', { count: 'exact' })
      .eq('user_id', user.id);
    
    console.log('📊 fetchTeams - Member teams result:', { 
      count: memberCount, 
      error: memberErr,
      data: memberRows?.length || 0
    });
    
    if (memberErr) {
      console.error('❌ fetchTeams - Member teams error:', memberErr);
    }

    const memberIds = (memberRows || []).map(r => r.team_id);
    let memberTeams: Team[] = [];
    
    if (memberIds.length > 0) {
      console.log('🔍 fetchTeams - Fetching teams by IDs:', memberIds);
      const { data: teamsByIds, error: teamsErr, count: teamsCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact' })
        .in('id', memberIds);
      
      console.log('📊 fetchTeams - Teams by IDs result:', { 
        count: teamsCount, 
        error: teamsErr,
        data: teamsByIds?.length || 0
      });
      
      if (teamsErr) {
        console.error('❌ fetchTeams - Teams by IDs error:', teamsErr);
      }
      
      memberTeams = (teamsByIds || []) as Team[];
    }

    const all = [ ...(owned || []), ...memberTeams ];
    const unique = all.filter((team, index, self) => index === self.findIndex(t => t.id === team.id));
    
    console.log('✅ fetchTeams - Final result:', {
      owned: owned?.length || 0,
      memberTeams: memberTeams.length,
      total: unique.length,
      teams: unique
    });
    
    return unique;
  } catch (error) {
    console.error('❌ fetchTeams - Error:', error);
    throw error;
  }
}

export async function createTeam(input: { name: string; description?: string; avatar_url?: string }): Promise<Team> {
  const supabase = getSupabase();
  const user = await getUserCached();
  
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({ 
      name: input.name, 
      description: input.description,
      avatar_url: input.avatar_url,
      owner_id: user?.id 
    })
    .select('*')
    .single();
    
  if (teamErr) throw teamErr;
  return team as Team;
}

export async function updateTeam(input: { 
  team_id: string; 
  name?: string; 
  description?: string; 
  avatar_url?: string;
  primary_project_id?: string | null;
}): Promise<Team> {
  const supabase = getSupabase();
  
  // Yetki kontrolü
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', input.team_id)
    .single();
    
  if (teamError || !team) throw new Error('Takım bulunamadı');
  if (team.owner_id !== user.id) throw new Error('Bu işlem için yetkiniz yok');
  
  const { data, error } = await supabase
    .from('teams')
    .update(input)
    .eq('id', input.team_id)
    .select('*')
    .single();
    
  if (error) throw error;
  return data as Team;
}

export async function inviteToTeam(input: { 
  team_id: string; 
  email: string; 
  role?: TeamRole;
  message?: string;
}): Promise<{ invitation: TeamInvitation; inviteUrl: string; teamName?: string }> {
  const supabase = getSupabase();
  const token = crypto.randomUUID();
  
  // Önce kullanıcının bu takımın sahibi veya admin'i olup olmadığını kontrol et
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('name, owner_id')
    .eq('id', input.team_id)
    .single();
  
  if (teamError) throw teamError;
  if (!team) throw new Error('Takım bulunamadı');
  
  // Takım sahibi veya admin davet gönderebilir
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', input.team_id)
    .eq('user_id', user.id)
    .single();
    
  if (team.owner_id !== user.id && (!membership || !['owner', 'admin'].includes(membership.role))) {
    throw new Error('Bu işlem için yetkiniz yok. Sadece takım sahibi ve admin\'ler davet gönderebilir.');
  }
  
  // Davet oluştur
  const { data, error } = await supabase
    .from('team_invitations')
    .insert({ 
      team_id: input.team_id, 
      email: input.email, 
      role: input.role ?? 'member', 
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    })
    .select('*')
    .single();
  
  if (error) throw error;
  
  const inviteUrl = `${window.location.origin}/invite/${token}`;
  return { invitation: data as TeamInvitation, inviteUrl, teamName: team?.name };
}

export async function bulkInviteToTeam(input: { 
  team_id: string; 
  emails: string[]; 
  role?: TeamRole;
  message?: string;
}): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };
  
  for (const email of input.emails) {
    try {
      await inviteToTeam({ 
        team_id: input.team_id, 
        email: email.trim(), 
        role: input.role 
      });
      results.success.push(email);
    } catch {
      results.failed.push(email);
    }
  }
  
  return results;
}

export async function revokeTeamInvitation(invitationId: string): Promise<void> {
  const supabase = getSupabase();
  
  // Yetki kontrolü
  const { data: inv, error: invErr } = await supabase
    .from('team_invitations')
    .select('team_id')
    .eq('id', invitationId)
    .single();
    
  if (invErr || !inv) throw invErr ?? new Error('Davet bulunamadı');
  
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  // Takım sahibi veya admin davet iptal edebilir
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', inv.team_id)
    .single();
    
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', inv.team_id)
    .eq('user_id', user.id)
    .single();
    
  if (!team || (!membership && team.owner_id !== user.id) || 
      (membership && !['owner', 'admin'].includes(membership.role) && team.owner_id !== user.id)) {
    throw new Error('Bu işlem için yetkiniz yok');
  }
  
  const { error } = await supabase
    .from('team_invitations')
    .delete()
    .eq('id', invitationId);
    
  if (error) throw error;
}

export async function resendTeamInvitation(invitationId: string): Promise<TeamInvitation> {
  const supabase = getSupabase();
  
  // Yetki kontrolü
  const { data: inv, error: invErr } = await supabase
    .from('team_invitations')
    .select('id, team_id')
    .eq('id', invitationId)
    .single();
    
  if (invErr || !inv) throw invErr ?? new Error('Davet bulunamadı');
  
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  // Takım sahibi veya admin davet yeniden gönderebilir
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', inv.team_id)
    .single();
    
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', inv.team_id)
    .eq('user_id', user.id)
    .single();
    
  if (!team || (!membership && team.owner_id !== user.id) || 
      (membership && !['owner', 'admin'].includes(membership.role) && team.owner_id !== user.id)) {
    throw new Error('Bu işlem için yetkiniz yok');
  }
  
  const token = crypto.randomUUID();
  const { data, error } = await supabase
    .from('team_invitations')
    .update({ 
      token, 
      accepted_at: null, 
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() 
    })
    .eq('id', invitationId)
    .select('*')
    .single();
    
  if (error) throw error;
  return data as TeamInvitation;
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_team_members', { p_team_id: teamId });
  if (error) throw error;
  
  const rows = (data ?? []) as Array<{ 
    id: string; 
    team_id: string; 
    user_id: string; 
    role: string; 
    created_at: string; 
    email: string | null; 
    full_name: string | null;
    avatar_url?: string | null;
  }>;
  
  return rows.map(r => ({
    id: r.id,
    team_id: r.team_id,
    user_id: r.user_id,
    email: r.email ?? null,
    name: r.full_name ?? (r.email ? r.email.split('@')[0] : null),
    role: r.role as TeamRole,
    joined_at: r.created_at,
    avatar_url: r.avatar_url ?? null,
  }));
}

export async function getTeamMembersForInvited(teamId: string): Promise<TeamMember[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_team_members_for_invited', { p_team_id: teamId });
  if (error) throw error;
  
  const rows = (data ?? []) as Array<{ 
    id: string; 
    team_id: string; 
    user_id: string; 
    role: string; 
    created_at: string; 
    email: string | null; 
    full_name: string | null;
    avatar_url?: string | null;
  }>;
  
  return rows.map(r => ({
    id: r.id,
    team_id: r.team_id,
    user_id: r.user_id,
    email: r.email ?? null,
    name: r.full_name ?? (r.email ? r.email.split('@')[0] : null),
    role: r.role as TeamRole,
    joined_at: r.created_at,
    avatar_url: r.avatar_url ?? null,
  }));
}

export async function updateTeamMemberRole(input: { 
  team_id: string; 
  user_id: string; 
  new_role: TeamRole;
}): Promise<void> {
  const supabase = getSupabase();
  
  // Yetki kontrolü - sadece takım sahibi rol değiştirebilir
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', input.team_id)
    .single();
    
  if (!team || team.owner_id !== user.id) {
    throw new Error('Bu işlem için yetkiniz yok. Sadece takım sahibi rol değiştirebilir.');
  }
  
  // Kendi rolünü değiştiremez
  if (input.user_id === user.id) {
    throw new Error('Kendi rolünüzü değiştiremezsiniz.');
  }
  
  const { error } = await supabase
    .from('team_members')
    .update({ role: input.new_role })
    .eq('team_id', input.team_id)
    .eq('user_id', input.user_id);
    
  if (error) throw error;
}

export async function removeTeamMember(input: { 
  team_id: string; 
  user_id: string;
}): Promise<void> {
  const supabase = getSupabase();
  
  // Yetki kontrolü - takım sahibi veya admin üye çıkarabilir
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', input.team_id)
    .single();
    
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', input.team_id)
    .eq('user_id', user.id)
    .single();
    
  if (!team || (!membership && team.owner_id !== user.id) || 
      (membership && !['owner', 'admin'].includes(membership.role) && team.owner_id !== user.id)) {
    throw new Error('Bu işlem için yetkiniz yok');
  }
  
  // Kendini çıkaramaz
  if (input.user_id === user.id) {
    throw new Error('Kendinizi takımdan çıkaramazsınız.');
  }
  
  // Takım sahibini çıkaramaz
  if (input.user_id === team.owner_id) {
    throw new Error('Takım sahibini takımdan çıkaramazsınız.');
  }
  
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', input.team_id)
    .eq('user_id', input.user_id);
    
  if (error) throw error;
}

export async function leaveTeam(team_id: string): Promise<void> {
  const supabase = getSupabase();
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  // Takım sahibi takımdan ayrılamaz
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', team_id)
    .single();
    
  if (team?.owner_id === user.id) {
    throw new Error('Takım sahibi takımdan ayrılamaz. Önce takımı başka birine devretmelisiniz.');
  }
  
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', team_id)
    .eq('user_id', user.id);
    
  if (error) throw error;
}

export async function transferTeamOwnership(input: { 
  team_id: string; 
  new_owner_id: string;
}): Promise<void> {
  const supabase = getSupabase();
  
  // Sadece mevcut takım sahibi yetki devredebilir
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', input.team_id)
    .single();
    
  if (!team || team.owner_id !== user.id) {
    throw new Error('Bu işlem için yetkiniz yok. Sadece takım sahibi yetki devredebilir.');
  }
  
  // Yeni sahip takım üyesi olmalı
  const { data: newOwnerMember } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', input.team_id)
    .eq('user_id', input.new_owner_id)
    .single();
    
  if (!newOwnerMember) {
    throw new Error('Yeni takım sahibi takım üyesi olmalıdır.');
  }
  
  // Transaction: Takım sahipliğini değiştir ve eski sahibi üye yap
  const { error: updateError } = await supabase
    .from('teams')
    .update({ owner_id: input.new_owner_id })
    .eq('id', input.team_id);
    
  if (updateError) throw updateError;
  
  // Eski sahibi admin yap
  const { error: memberError } = await supabase
    .from('team_members')
    .upsert({
      team_id: input.team_id,
      user_id: user.id,
      role: 'admin'
    });
    
  if (memberError) throw memberError;
}

export async function getTeamStats(team_id: string): Promise<TeamStats> {
  const supabase = getSupabase();
  
  // Üye sayısı
  const { count: memberCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team_id);
  
  // Proje sayısı - team_id alanını kullan
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team_id);
  
  // Aktif görev sayısı - projeler üzerinden hesapla
  const { data: teamProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('team_id', team_id);
  
  const projectIds = teamProjects?.map(p => p.id) || [];
  let activeTaskCount = 0;
  let completedTaskCount = 0;
  
  if (projectIds.length > 0) {
    const { count: activeCount } = await supabase
      .from('project_tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .neq('status', 'completed');
    
    const { count: completedCount } = await supabase
      .from('project_tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('status', 'completed');
    
    activeTaskCount = activeCount || 0;
    completedTaskCount = completedCount || 0;
  }
  
  return {
    member_count: memberCount || 0,
    project_count: projectCount || 0,
    active_task_count: activeTaskCount,
    completed_task_count: completedTaskCount,
  };
}

// Davet kabul etme fonksiyonu
export async function acceptTeamInvitation(token: string) {
  const supabase = getSupabase();
  
  // 1. Davet bilgilerini al
  const { data: invitation, error: inviteError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .single();
  
  if (inviteError) throw inviteError;
  if (!invitation) throw new Error('Davet bulunamadı');
  
  // 2. Davet süresi kontrolü
  if (new Date() > new Date(invitation.expires_at)) {
    throw new Error('Davet süresi dolmuş');
  }
  
  // 3. Davet zaten kabul edilmiş mi kontrolü
  if (invitation.accepted_at) {
    throw new Error('Bu davet zaten kabul edilmiş');
  }
  
  // 4. Mevcut kullanıcı bilgilerini al
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı bilgileri alınamadı');
  
  // 5. E-posta kontrolü (case-insensitive ve trim)
  const invitedEmail = (invitation.email || '').trim().toLowerCase()
  const currentEmail = (user.email || '').trim().toLowerCase()
  if (invitedEmail !== currentEmail) {
    // Devam etmeden önce kullanıcıya anlaşılır bir mesaj ver
    throw new Error(`Bu davet ${invitation.email} adresine ait. Giriş yaptığınız hesap: ${user.email || '—'}`)
  }
  
  // 6. Zaten takım üyesi mi kontrolü
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', invitation.team_id)
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (existingMember) {
    throw new Error('Zaten bu takımın üyesisiniz');
  }
  
  // 7. Transaction: Davet kabul et ve üye ekle
  const { error: acceptError } = await supabase
    .from('team_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token);
  
  if (acceptError) throw acceptError;
  
  const { data: member, error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: invitation.team_id,
      user_id: user.id,
      role: invitation.role
    })
    .select('*')
    .single();
  
  if (memberError) throw memberError;
  
  return member;
}

export async function declineTeamInvitation(token: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('team_invitations')
    .delete()
    .eq('token', token);
  if (error) throw error;
}

// Kullanıcının bekleyen davetlerini getir
export async function getPendingInvitations() {
  const supabase = getSupabase();
  const user = await getUserCached();
  
  if (!user?.email) return [];
  
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams (
          id,
          name,
          owner_id
        )
      `)
      .eq('email', user.email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Davetler yüklenirken hata:', error);
      return [];
    }
    
      return data ?? [];
  } catch (error) {
    console.warn('Davetler yüklenirken hata:', error);
    return [];
  }
}

// Takım davetlerini getir (sadece takım sahibi için)
export async function getTeamInvitations(teamId: string) {
  const supabase = getSupabase();
  const user = await getUserCached();
  
  if (!user) return [];
  
  try {
    // Önce kullanıcının bu takımın sahibi olup olmadığını kontrol et
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();
    
    if (teamError || !team) return [];
    
    // Sadece takım sahibi davetleri görebilir
    if (team.owner_id !== user.id) return [];
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Takım davetleri yüklenirken hata:', error);
      return [];
    }
    
    return data ?? [];
  } catch (error) {
    console.warn('Takım davetleri yüklenirken hata:', error);
    return [];
  }
}

export async function deleteTeam(team_id: string): Promise<void> {
  const supabase = getSupabase();
  
  // Yetki kontrolü - sadece takım sahibi silebilir
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', team_id)
    .single();
    
  if (!team || team.owner_id !== user.id) {
    throw new Error('Bu işlem için yetkiniz yok. Sadece takım sahibi takımı silebilir.');
  }
  
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', team_id);
    
  if (error) throw error;
}

export async function updateTeamName(input: { team_id: string; name: string }): Promise<Team> {
  const supabase = getSupabase();
  
  // Yetki kontrolü - takım sahibi veya admin isim değiştirebilir
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', input.team_id)
    .single();
    
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', input.team_id)
    .eq('user_id', user.id)
    .single();
    
  if (!team || (!membership && team.owner_id !== user.id) || 
      (membership && !['owner', 'admin'].includes(membership.role) && team.owner_id !== user.id)) {
    throw new Error('Bu işlem için yetkiniz yok');
  }
  
  const { data, error } = await supabase
    .from('teams')
    .update({ name: input.name })
    .eq('id', input.team_id)
    .select('*')
    .single();
    
  if (error) throw error;
  return data as Team;
}

export async function setTeamPrimaryProject(input: { team_id: string; project_id: string | null }): Promise<Team> {
  const supabase = getSupabase();
  
  // Yetki kontrolü - takım sahibi veya admin birincil proje ayarlayabilir
  const user = await getUserCached();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', input.team_id)
    .single();
    
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', input.team_id)
    .eq('user_id', user.id)
    .single();
    
  if (!team || (!membership && team.owner_id !== user.id) || 
      (membership && !['owner', 'admin'].includes(membership.role) && team.owner_id !== user.id)) {
    throw new Error('Bu işlem için yetkiniz yok');
  }
  
  const { data, error } = await supabase
    .from('teams')
    .update({ primary_project_id: input.project_id })
    .eq('id', input.team_id)
    .select('*')
    .single();
    
  if (error) throw error;
  return data as Team;
}


