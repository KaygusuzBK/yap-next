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
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];
  
  // Kullanıcının sahibi olduğu takımları al
  const { data: ownedTeams, error: ownedError } = await supabase
    .from('teams')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });
  
  if (ownedError) throw ownedError;
  
  // Kullanıcının üyesi olduğu takımları al
  const { data: memberTeams, error: memberError } = await supabase
    .from('team_members')
    .select(`
      teams (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (memberError) throw memberError;
  
  // İki listeyi birleştir ve tekrarları kaldır
  const allTeams = [
    ...(ownedTeams || []),
    ...(memberTeams?.map(mt => mt.teams).filter(Boolean) || [])
  ];
  
  // Tekrarları kaldır (aynı takım hem sahip hem üye olabilir)
  const uniqueTeams = allTeams.filter((team, index, self) => 
    index === self.findIndex(t => t.id === team.id)
  );
  
  return uniqueTeams;
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

export async function inviteToTeam(input: { team_id: string; email: string; role?: string }): Promise<{ invitation: TeamInvitation; inviteUrl: string; teamName?: string }> {
  const supabase = getSupabase();
  const token = crypto.randomUUID();
  
  // Önce kullanıcının bu takımın sahibi olup olmadığını kontrol et
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı girişi yapılmamış');
  
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('name, owner_id')
    .eq('id', input.team_id)
    .single();
  
  if (teamError) throw teamError;
  if (!team) throw new Error('Takım bulunamadı');
  
  // Sadece takım sahibi davet gönderebilir
  if (team.owner_id !== user.id) {
    throw new Error('Bu işlem için yetkiniz yok. Sadece takım sahibi davet gönderebilir.');
  }
  
  // Davet oluştur
  const { data, error } = await supabase
    .from('team_invitations')
    .insert({ team_id: input.team_id, email: input.email, role: input.role ?? 'member', token })
    .select('*')
    .single();
  
  if (error) throw error;
  
  // Artık e-postayı kullanıcı kendi istemcisinden gönderecek; davet bağlantısını döndürüyoruz
  const inviteUrl = `${window.location.origin}/invite/${token}`;
  return { invitation: data as TeamInvitation, inviteUrl, teamName: team?.name };
}

export type TeamInvitation = {
  id: string;
  team_id: string;
  email: string;
  role: string;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export async function revokeTeamInvitation(invitationId: string): Promise<void> {
  const supabase = getSupabase();
  // Check ownership
  const { data: inv, error: invErr } = await supabase
    .from('team_invitations')
    .select('team_id')
    .eq('id', invitationId)
    .single();
  if (invErr || !inv) throw invErr ?? new Error('Davet bulunamadı');
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', inv.team_id)
    .single();
  const { data: { user } } = await supabase.auth.getUser();
  if (!team || !user || team.owner_id !== user.id) throw new Error('Bu işlem için yetkiniz yok');
  const { error } = await supabase.from('team_invitations').delete().eq('id', invitationId);
  if (error) throw error;
}

export async function resendTeamInvitation(invitationId: string): Promise<TeamInvitation> {
  const supabase = getSupabase();
  // Check ownership and fetch invitation
  const { data: inv, error: invErr } = await supabase
    .from('team_invitations')
    .select('id, team_id')
    .eq('id', invitationId)
    .single();
  if (invErr || !inv) throw invErr ?? new Error('Davet bulunamadı');
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', inv.team_id)
    .single();
  const { data: { user } } = await supabase.auth.getUser();
  if (!team || !user || team.owner_id !== user.id) throw new Error('Bu işlem için yetkiniz yok');
  const token = crypto.randomUUID();
  const { data, error } = await supabase
    .from('team_invitations')
    .update({ token, accepted_at: null, expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() })
    .eq('id', invitationId)
    .select('*')
    .single();
  if (error) throw error;
  return data as TeamInvitation;
}

export type TeamMember = {
  id: string;
  user_id: string;
  email: string | null;
  name: string | null;
  role: string;
  joined_at: string;
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('team_members')
    .select('id, team_id, user_id, role, created_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Array<{ id: string; team_id: string; user_id: string; role: string; created_at: string }>
  const userIds = rows.map(r => r.user_id)
  let profiles: Array<{ id: string; email: string | null; full_name: string | null }> = []
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
    profiles = (profs ?? []) as Array<{ id: string; email: string | null; full_name: string | null }>
  }
  const idToProfile = new Map(profiles.map(p => [p.id, p]))
  return rows.map(r => {
    const prof = idToProfile.get(r.user_id)
    return {
      id: r.id,
      user_id: r.user_id,
      email: prof?.email ?? null,
      name: prof?.full_name ?? (prof?.email ? prof.email.split('@')[0] : null),
      role: r.role,
      joined_at: r.created_at,
    }
  })
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
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Kullanıcı bilgileri alınamadı');
  
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
    .single();
  
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
  const { data: { user } } = await supabase.auth.getUser();
  
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
  const { data: { user } } = await supabase.auth.getUser();
  
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


