"use client";

import { getSupabase } from "@/lib/supabase";
import { getUserCached } from "@/lib/auth-cache";

export type ActivityType = 
  | 'task_created'
  | 'task_updated' 
  | 'task_completed'
  | 'task_assigned'
  | 'task_comment'
  | 'project_comment'
  | 'project_created'
  | 'project_updated'
  | 'team_joined'
  | 'file_uploaded';

export type Activity = {
  id: string;
  type: ActivityType;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  project_id?: string | null;
  project_title?: string | null;
  task_id?: string | null;
  task_title?: string | null;
  content?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
};

export async function fetchRecentActivities(limit = 20): Promise<Activity[]> {
  const supabase = getSupabase();
  
  try {
    // RPC fonksiyonunu dene
    const { data, error } = await supabase.rpc('get_recent_activities', {
      p_limit: limit
    });

    if (!error && data) {
      // RPC varsa bile sonuçları kullanıcı kapsamına göre süzelim
      const scoped = await scopeActivitiesToUser((data ?? []) as Activity[]);
      return scoped.slice(0, limit);
    }
  } catch (rpcError) {
    console.warn('RPC function not available, using manual fetch:', rpcError);
  }

  // Fallback: manuel olarak farklı tablolardan veri çek
  return await fetchActivitiesManually(limit);
}

async function fetchActivitiesManually(limit: number): Promise<Activity[]> {
  const supabase = getSupabase();

  try {
    // Kullanıcının görebileceği projeleri belirle
    const user = await getUserCached();
    const allowedProjectIds = await getAllowedProjectIdsForUser();

    // 1) Ana kaynakları paralel al
    const [taskActivitiesRes, taskCommentsRes, newTasksRes] = await Promise.all([
      supabase.from('task_activities').select('id, task_id, user_id, action, details, created_at').order('created_at', { ascending: false }).limit(limit),
      supabase.from('task_comments').select('id, task_id, created_by, content, created_at').order('created_at', { ascending: false }).limit(limit),
      supabase.from('project_tasks')
        .select('id, project_id, title, created_by, created_at')
        .in('project_id', allowedProjectIds.length ? allowedProjectIds : ['00000000-0000-0000-0000-000000000000'])
        .order('created_at', { ascending: false })
        .limit(limit),
    ])

    const taskActivities = taskActivitiesRes.data ?? []
    const taskComments = taskCommentsRes.data ?? []
    const newTasks = newTasksRes.data ?? []

    // 2) Gerekli id set'lerini topla
    const userIds = new Set<string>()
    const taskIds = new Set<string>()
    const projectIds = new Set<string>()

    taskActivities.forEach(a => { userIds.add(a.user_id); if (a.task_id) taskIds.add(a.task_id) })
    taskComments.forEach(c => { userIds.add(c.created_by); if (c.task_id) taskIds.add(c.task_id) })
    newTasks.forEach(t => { userIds.add(t.created_by); projectIds.add(t.project_id) })

    // 3) Boşsa kısa devre
    const userIdsArr = Array.from(userIds)
    const taskIdsArr = Array.from(taskIds)

    // 4) Bağımlı tabloları paralel çek (boş listelerde sorgu atlama)
    const [profilesRes, tasksRes, projectsRes] = await Promise.all([
      userIdsArr.length ? supabase.from('profiles').select('id, full_name, email').in('id', userIdsArr) : Promise.resolve({ data: [], error: null } as any),
      taskIdsArr.length ? supabase.from('project_tasks').select('id, title, project_id').in('id', taskIdsArr) : Promise.resolve({ data: [], error: null } as any),
      // newTasks'tan projectIds zaten var; task->project için de lazım olabilir
      (projectIds.size > 0 || taskIdsArr.length > 0)
        ? supabase.from('projects').select('id, title').in('id', Array.from(projectIds))
        : Promise.resolve({ data: [], error: null } as any),
    ])

    const profiles = (profilesRes.data ?? []) as Array<{ id: string; full_name?: string | null; email?: string | null }>
    const tasks = (tasksRes.data ?? []) as Array<{ id: string; title?: string; project_id?: string }>
    const projects = (projectsRes.data ?? []) as Array<{ id: string; title?: string }>

    const profileMap = new Map<string, { full_name?: string | null; email?: string | null }>(profiles.map((p) => [p.id, p]))
    const taskMap = new Map<string, { id: string; title?: string; project_id?: string }>(tasks.map((t) => [t.id, t]))
    const projectMap = new Map<string, { id: string; title?: string }>(projects.map((p) => [p.id, p]))

    const activities: Activity[] = []

    // Task activities (proje kapsamına göre filtrele)
    for (const activity of taskActivities) {
      const profile = profileMap.get(activity.user_id)
      const task = activity.task_id ? taskMap.get(activity.task_id) : null
      const project = task && task.project_id ? projectMap.get(task.project_id) : null
      if (project && allowedProjectIds.length > 0 && !allowedProjectIds.includes(project.id)) continue
      activities.push({
        id: activity.id,
        type: mapTaskActionToType(activity.action),
        user_id: activity.user_id,
        user_name: profile?.full_name || null,
        user_email: profile?.email || null,
        project_id: (task?.project_id as string | undefined) || null,
        project_title: project?.title || null,
        task_id: activity.task_id,
        task_title: task?.title || null,
        details: activity.details,
        created_at: activity.created_at,
      })
    }

    // Task comments (proje kapsamına göre filtrele)
    for (const comment of taskComments) {
      const profile = profileMap.get(comment.created_by)
      const task = comment.task_id ? taskMap.get(comment.task_id) : null
      const project = task && task.project_id ? projectMap.get(task.project_id) : null
      if (project && allowedProjectIds.length > 0 && !allowedProjectIds.includes(project.id)) continue
      activities.push({
        id: comment.id,
        type: 'task_comment',
        user_id: comment.created_by,
        user_name: profile?.full_name || null,
        user_email: profile?.email || null,
        project_id: (task?.project_id as string | undefined) || null,
        project_title: project?.title || null,
        task_id: comment.task_id,
        task_title: task?.title || null,
        content: comment.content,
        created_at: comment.created_at,
      })
    }

    // New tasks
    for (const task of newTasks) {
      const profile = profileMap.get(task.created_by)
      const project = task.project_id ? projectMap.get(task.project_id) : undefined
      activities.push({
        id: task.id,
        type: 'task_created',
        user_id: task.created_by,
        user_name: profile?.full_name || null,
        user_email: profile?.email || null,
        project_id: task.project_id,
        project_title: project?.title || null,
        task_id: task.id,
        task_title: task.title,
        created_at: task.created_at,
      })
    }

    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching activities manually:', error);
    return [];
  }
}

// Aktiviteleri kullanıcı kapsamına (üye olduğu takımlar ve dahil olduğu projeler) göre filtreler
async function scopeActivitiesToUser(list: Activity[]): Promise<Activity[]> {
  const allowed = new Set<string>(await getAllowedProjectIdsForUser())
  return list.filter(a => !a.project_id || allowed.has(a.project_id))
}

// Kullanıcının görebileceği proje ID'lerini getirir: sahibi olduğu projeler,
// üyesi olduğu takımların projeleri ve project_members olduğu projeler
async function getAllowedProjectIdsForUser(): Promise<string[]> {
  const supabase = getSupabase();
  const user = await getUserCached();
  if (!user) return []

  // Üye olduğu takım id'leri
  const { data: tm } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)

  const teamIds = (tm ?? []).map(r => r.team_id as string)

  const [owned, teamProjects, memberProjects] = await Promise.all([
    supabase.from('projects').select('id').eq('owner_id', user.id),
    teamIds.length > 0
      ? supabase.from('projects').select('id').in('team_id', teamIds)
      : Promise.resolve({ data: [] as Array<{ id: string }>, error: null } as any),
    supabase.from('project_members').select('project_id').eq('user_id', user.id)
  ])

  const memberIds = (memberProjects.data ?? []).map(r => (r as { project_id: string }).project_id)
  const ids = new Set<string>([
    ...(((owned.data ?? []) as Array<{ id: string }>).map(p => p.id)),
    ...(((teamProjects.data ?? []) as Array<{ id: string }>).map(p => p.id)),
    ...memberIds,
  ])
  return Array.from(ids)
}

function mapTaskActionToType(action: string): ActivityType {
  switch (action) {
    case 'task_created':
      return 'task_created';
    case 'task_updated':
      return 'task_updated';
    case 'task_completed':
      return 'task_completed';
    case 'task_assigned':
      return 'task_assigned';
    default:
      return 'task_updated';
  }
}

export function formatActivityMessage(activity: Activity): string {
  const userName = activity.user_name || activity.user_email?.split('@')[0] || 'Bilinmeyen Kullanıcı';
  const projectName = activity.project_title || 'Bilinmeyen Proje';
  const taskName = activity.task_title || 'Bilinmeyen Görev';

  switch (activity.type) {
    case 'task_created':
      return `${userName} "${taskName}" görevini "${projectName}" projesinde oluşturdu`;
    
    case 'task_updated':
      return `${userName} "${taskName}" görevini "${projectName}" projesinde güncelledi`;
    
    case 'task_completed':
      return `${userName} "${taskName}" görevini "${projectName}" projesinde tamamladı`;
    
    case 'task_assigned':
      return `${userName} "${taskName}" görevini "${projectName}" projesinde atadı`;
    
    case 'task_comment':
      return `${userName} "${taskName}" görevine "${projectName}" projesinde yorum yaptı`;
    
    case 'project_comment':
      return `${userName} "${projectName}" projesine yorum yaptı`;
    
    case 'project_created':
      return `${userName} "${projectName}" projesini oluşturdu`;
    
    case 'project_updated':
      return `${userName} "${projectName}" projesini güncelledi`;
    
    case 'team_joined':
      return `${userName} takıma katıldı`;
    
    case 'file_uploaded':
      return `${userName} "${taskName}" görevine "${projectName}" projesinde dosya yükledi`;
    
    default:
      return `${userName} bir aktivite gerçekleştirdi`;
  }
}

export function getActivityIcon(activity: Activity): string {
  switch (activity.type) {
    case 'task_created':
      return '📝';
    case 'task_updated':
      return '✏️';
    case 'task_completed':
      return '✅';
    case 'task_assigned':
      return '👤';
    case 'task_comment':
    case 'project_comment':
      return '💬';
    case 'project_created':
      return '📁';
    case 'project_updated':
      return '🔄';
    case 'team_joined':
      return '👥';
    case 'file_uploaded':
      return '📎';
    default:
      return '🔔';
  }
}
