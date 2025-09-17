"use client";

import { getSupabase } from "@/lib/supabase";

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
      return (data ?? []) as Activity[];
    }
  } catch (rpcError) {
    console.warn('RPC function not available, using manual fetch:', rpcError);
  }

  // Fallback: manuel olarak farklı tablolardan veri çek
  return await fetchActivitiesManually(limit);
}

async function fetchActivitiesManually(limit: number): Promise<Activity[]> {
  const supabase = getSupabase();
  const activities: Activity[] = [];

  try {
    // 1. Görev aktiviteleri (task_activities) - basit sorgu
    const { data: taskActivities, error: taskActivitiesError } = await supabase
      .from('task_activities')
      .select('id, task_id, user_id, action, details, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!taskActivitiesError && taskActivities) {
      // Kullanıcı bilgilerini al
      const userIds = [...new Set(taskActivities.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Görev bilgilerini al
      const taskIds = [...new Set(taskActivities.map(a => a.task_id))];
      const { data: tasks } = await supabase
        .from('project_tasks')
        .select('id, title, project_id')
        .in('id', taskIds);

      const taskMap = new Map(tasks?.map(t => [t.id, t]) || []);

      // Proje bilgilerini al
      const projectIds = [...new Set(tasks?.map(t => t.project_id) || [])];
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title')
        .in('id', projectIds);

      const projectMap = new Map(projects?.map(p => [p.id, p]) || []);

      for (const activity of taskActivities) {
        const profile = profileMap.get(activity.user_id);
        const task = taskMap.get(activity.task_id);
        const project = task ? projectMap.get(task.project_id) : null;

        activities.push({
          id: activity.id,
          type: mapTaskActionToType(activity.action),
          user_id: activity.user_id,
          user_name: profile?.full_name || null,
          user_email: profile?.email || null,
          project_id: task?.project_id || null,
          project_title: project?.title || null,
          task_id: activity.task_id,
          task_title: task?.title || null,
          details: activity.details,
          created_at: activity.created_at,
        });
      }
    }

    // 2. Görev yorumları (task_comments) - basit sorgu
    const { data: taskComments, error: taskCommentsError } = await supabase
      .from('task_comments')
      .select('id, task_id, created_by, content, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!taskCommentsError && taskComments) {
      const userIds = [...new Set(taskComments.map(c => c.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const taskIds = [...new Set(taskComments.map(c => c.task_id))];
      const { data: tasks } = await supabase
        .from('project_tasks')
        .select('id, title, project_id')
        .in('id', taskIds);

      const taskMap = new Map(tasks?.map(t => [t.id, t]) || []);

      const projectIds = [...new Set(tasks?.map(t => t.project_id) || [])];
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title')
        .in('id', projectIds);

      const projectMap = new Map(projects?.map(p => [p.id, p]) || []);

      for (const comment of taskComments) {
        const profile = profileMap.get(comment.created_by);
        const task = taskMap.get(comment.task_id);
        const project = task ? projectMap.get(task.project_id) : null;

        activities.push({
          id: comment.id,
          type: 'task_comment',
          user_id: comment.created_by,
          user_name: profile?.full_name || null,
          user_email: profile?.email || null,
          project_id: task?.project_id || null,
          project_title: project?.title || null,
          task_id: comment.task_id,
          task_title: task?.title || null,
          content: comment.content,
          created_at: comment.created_at,
        });
      }
    }

    // 3. Yeni görevler (project_tasks) - basit sorgu
    const { data: newTasks, error: newTasksError } = await supabase
      .from('project_tasks')
      .select('id, project_id, title, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!newTasksError && newTasks) {
      const userIds = [...new Set(newTasks.map(t => t.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const projectIds = [...new Set(newTasks.map(t => t.project_id))];
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title')
        .in('id', projectIds);

      const projectMap = new Map(projects?.map(p => [p.id, p]) || []);

      for (const task of newTasks) {
        const profile = profileMap.get(task.created_by);
        const project = projectMap.get(task.project_id);

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
        });
      }
    }

    // Tüm aktiviteleri tarihe göre sırala ve limit uygula
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

  } catch (error) {
    console.error('Error fetching activities manually:', error);
    return [];
  }
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
