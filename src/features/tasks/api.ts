"use client";

import { getSupabase } from '@/lib/supabase';

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  // status is now a dynamic project-defined key
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  created_by: string;
  position?: number | null;
  creator_name?: string | null;
  creator_email?: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  project_title?: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  created_by: string;
  content: string;
  created_at: string;
  author_name?: string | null;
  author_email?: string | null;
};

export type TaskFile = {
  path: string;
  name: string;
  url: string | null;
  created_at?: string;
  size?: number | null;
};

const TASK_FILES_BUCKET = 'task-files';

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
    status: string;
    priority: Task['priority'];
    assigned_to: string | null;
    created_by: string;
    position?: number | null;
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
    position: row.position ?? null,
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
  status?: string;
  due_date?: string | null;
  notifySlack?: boolean;
  slackWebhookUrl?: string;
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
  const task = data as Task;

  // Notify Slack (best-effort, non-blocking)
  if (input.notifySlack) {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || ''
      const url = baseUrl ? `${baseUrl}/dashboard/tasks/${task.id}` : undefined
      // Fetch project title for Slack message
      let project_title: string | undefined
      try {
        const { data: proj } = await supabase
          .from('projects')
          .select('title')
          .eq('id', task.project_id)
          .single()
        project_title = proj?.title
      } catch {}
      await fetch('/api/slack/task-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: { id: task.id, title: task.title, project_id: task.project_id, project_title, priority: task.priority, status: task.status, due_date: task.due_date, url }, webhookUrl: input.slackWebhookUrl })
      }).catch(() => {})
    } catch {}
  }

  return task;
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
  
  // Projeye atanmış takımın tüm üyelerini göster
  // 1) Projenin takımını bul
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .single();
  if (projErr) throw projErr;
  const teamId = project?.team_id as string | null
  if (!teamId) {
    // Takımı yoksa proje üyeleri tablosuna düş
    const { data: projectMembers, error: projectError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId);
    if (projectError) throw projectError;
    const userIds = (projectMembers ?? []).map(pm => pm.user_id)
    if (userIds.length === 0) return []
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);
    if (usersError) throw usersError;
    return (users ?? []).map(user => ({
      id: user.id,
      email: user.email,
      name: user.full_name || (user.email ? user.email.split('@')[0] : '')
    }))
  }
  // 2) Takım üyelerini güvenli RPC ile al
  const { data: teamMembers, error: teamErr } = await supabase.rpc('get_team_members', { p_team_id: teamId })
  if (teamErr) throw teamErr
  type Row = { user_id: string; email: string | null; full_name: string | null }
  const rows: Row[] = (teamMembers as Array<Row> | null | undefined) ?? []
  return rows.map(r => ({
    id: r.user_id,
    email: r.email ?? '',
    name: r.full_name ?? (r.email ? r.email.split('@')[0] : '')
  }))
}

export async function updateTask(input: {
  id: string;
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  assigned_to?: string | null;
  due_date?: string | null;
  position?: number | null;
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
      position: input.position,
    })
    .eq('id', input.id)
    .select('*')
    .single();
    
  if (error) throw error;
  const updated = data as Task;
  // Best-effort: notify Slack about updates if env configured
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || ''
    const url = baseUrl ? `${baseUrl}/dashboard/tasks/${updated.id}` : undefined
    await fetch('/api/slack/task-updated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: updated.id, title: updated.title, status: updated.status, priority: updated.priority, url })
    }).catch(() => {})
  } catch {}
  return updated;
}

// Project-specific task statuses
export type ProjectTaskStatus = {
  id: string;
  project_id: string;
  key: string;
  label: string;
  group: 'todo' | 'in_progress' | 'review' | 'completed';
  position: number;
  is_default: boolean;
  color?: string;
  created_at: string;
  updated_at: string;
}

export async function fetchProjectStatuses(projectId: string): Promise<ProjectTaskStatus[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('project_task_statuses')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProjectTaskStatus[];
}

export async function fetchStatusesForProjects(projectIds: string[]): Promise<Record<string, ProjectTaskStatus[]>> {
  const supabase = getSupabase();
  if (projectIds.length === 0) return {};
  const { data, error } = await supabase
    .from('project_task_statuses')
    .select('*')
    .in('project_id', projectIds)
    .order('position', { ascending: true });
  if (error) throw error;
  const map: Record<string, ProjectTaskStatus[]> = {};
  for (const row of (data ?? []) as ProjectTaskStatus[]) {
    if (!map[row.project_id]) map[row.project_id] = [];
    map[row.project_id].push(row);
  }
  return map;
}

export async function createProjectStatus(input: {
  project_id: string;
  key: string;
  label: string;
  group: ProjectTaskStatus['group'];
  position?: number;
  is_default?: boolean;
  color?: string;
}): Promise<ProjectTaskStatus> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('project_task_statuses')
    .insert({
      project_id: input.project_id,
      key: input.key,
      label: input.label,
      group: input.group,
      position: input.position ?? 0,
      is_default: input.is_default ?? false,
      color: input.color ?? '#64748b',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ProjectTaskStatus;
}

export async function updateProjectStatus(input: {
  id: string;
  label?: string;
  group?: ProjectTaskStatus['group'];
  position?: number;
  is_default?: boolean;
  color?: string;
}): Promise<ProjectTaskStatus> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('project_task_statuses')
    .update({
      label: input.label,
      group: input.group,
      position: input.position,
      is_default: input.is_default,
      color: input.color,
    })
    .eq('id', input.id)
    .select('*')
    .single();
  if (error) throw error;
  return data as ProjectTaskStatus;
}

export async function deleteProjectStatus(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('project_task_statuses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Deprecated: default status concept removed from UI flow

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

  // Fetch creator profile for display name/email
  let creator_name: string | null = null
  let creator_email: string | null = null
  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', data.created_by)
      .single()
    if (prof) {
      creator_name = (prof as { full_name?: string | null }).full_name ?? null
      creator_email = (prof as { email?: string | null }).email ?? null
    }
  } catch {}

  const projectTitle = (data as { projects?: { title?: string | null } }).projects?.title ?? 'Bilinmeyen Proje'
  return {
    ...data,
    project_title: projectTitle,
    creator_name,
    creator_email,
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

// Comments CRUD
export async function fetchComments(taskId: string): Promise<TaskComment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('task_comments')
    .select(`id, task_id, created_by, content, created_at`)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  type Row = { id: string; task_id: string; created_by: string; content: string; created_at: string }
  const rows: Row[] = (data as Row[]) ?? []
  const uniqueUserIds = Array.from(new Set(rows.map(r => r.created_by)))
  let idToProfile: Record<string, { full_name?: string | null; email?: string | null }> = {}
  if (uniqueUserIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', uniqueUserIds)
    if (profs) {
      type Prof = { id: string; full_name?: string | null; email?: string | null }
      idToProfile = Object.fromEntries((profs as Prof[]).map((p) => [p.id, { full_name: p.full_name, email: p.email }]))
    }
  }
  return rows.map((row) => ({
    id: row.id,
    task_id: row.task_id,
    created_by: row.created_by,
    content: row.content,
    created_at: row.created_at,
    author_name: idToProfile[row.created_by]?.full_name ?? null,
    author_email: idToProfile[row.created_by]?.email ?? null,
  }))
}

export async function addComment(taskId: string, content: string): Promise<TaskComment> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, created_by: user.id, content })
    .select(`id, task_id, created_by, content, created_at`)
    .single();
  if (error) throw error;
  type Row = { id: string; task_id: string; created_by: string; content: string; created_at: string }
  const row = data as Row
  // fetch profile for author
  let authorName: string | null = null
  let authorEmail: string | null = null
  const { data: prof } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', row.created_by)
    .single()
  if (prof) { authorName = prof.full_name ?? null; authorEmail = prof.email ?? null }
  return {
    id: row.id,
    task_id: row.task_id,
    created_by: row.created_by,
    content: row.content,
    created_at: row.created_at,
    author_name: authorName,
    author_email: authorEmail,
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
  if (error) throw error;
}

// Files (Supabase Storage)
export async function listTaskFiles(taskId: string): Promise<TaskFile[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(TASK_FILES_BUCKET).list(taskId, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'asc' },
  });
  if (error) throw error;
  type Entry = { name: string; created_at?: string; metadata?: { size?: number } }
  const files = ((data as Entry[]) ?? []).map((f) => {
    const fullPath = `${taskId}/${f.name}`;
    const pub = supabase.storage.from(TASK_FILES_BUCKET).getPublicUrl(fullPath);
    return {
      path: fullPath,
      name: f.name,
      url: pub.data.publicUrl || null,
      created_at: f.created_at || undefined,
      size: f.metadata?.size ?? null,
    } as TaskFile;
  });
  return files;
}

export async function uploadTaskFile(taskId: string, file: File): Promise<TaskFile> {
  const supabase = getSupabase();
  // Validate size (<= 10MB) and MIME (basic allow list)
  const maxBytes = 10 * 1024 * 1024
  if (file.size > maxBytes) throw new Error('Dosya boyutu 10MB sınırını aşıyor')
  const allowed = ['image/png','image/jpeg','image/gif','application/pdf','text/plain']
  if (file.type && !allowed.includes(file.type)) throw new Error('İzin verilmeyen içerik türü')
  // Sanitize filename strictly
  const base = (file.name || 'file').toLowerCase()
  const safeName = base.replace(/[^a-z0-9_.-]/g, '_').replace(/_+/g, '_').slice(0, 120)
  const path = `${taskId}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage
    .from(TASK_FILES_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  const pub = supabase.storage.from(TASK_FILES_BUCKET).getPublicUrl(path);
  return { path, name: path.split('/').pop() || file.name, url: pub.data.publicUrl };
}

export async function deleteTaskFile(path: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(TASK_FILES_BUCKET).remove([path]);
  if (error) throw error;
}

// Time logs
export type TaskTimeLog = {
  id: string
  task_id: string
  user_id: string
  start_time: string
  end_time: string | null
  description: string | null
  created_at: string
}

export async function listTimeLogs(taskId: string): Promise<TaskTimeLog[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('task_time_logs')
    .select('id, task_id, user_id, start_time, end_time, description, created_at')
    .eq('task_id', taskId)
    .order('start_time', { ascending: false })
  if (error) throw error
  return (data as TaskTimeLog[]) ?? []
}

export async function addTimeLog(input: { task_id: string; start_time: string; end_time?: string | null; description?: string | null }): Promise<TaskTimeLog> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
  const { data, error } = await supabase
    .from('task_time_logs')
    .insert({ task_id: input.task_id, user_id: user.id, start_time: input.start_time, end_time: input.end_time ?? null, description: input.description ?? null })
    .select('id, task_id, user_id, start_time, end_time, description, created_at')
    .single()
  if (error) throw error
  return data as TaskTimeLog
}

export async function deleteTimeLog(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('task_time_logs')
    .delete()
    .eq('id', id)
  if (error) throw error
}


