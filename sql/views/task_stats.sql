-- Görev istatistikleri view'ları

-- Proje bazında görev istatistikleri
create or replace view public.project_task_stats as
select 
  p.id as project_id,
  p.title as project_title,
  p.owner_id,
  count(t.id) as total_tasks,
  count(t.id) filter (where t.status = 'todo') as todo_tasks,
  count(t.id) filter (where t.status = 'in_progress') as in_progress_tasks,
  count(t.id) filter (where t.status = 'review') as review_tasks,
  count(t.id) filter (where t.status = 'completed') as completed_tasks,
  count(t.id) filter (where t.priority = 'urgent') as urgent_tasks,
  count(t.id) filter (where t.priority = 'high') as high_priority_tasks,
  count(t.id) filter (where t.due_date < now() and t.status != 'completed') as overdue_tasks,
  count(t.id) filter (where t.assigned_to is not null) as assigned_tasks,
  count(t.id) filter (where t.assigned_to is null) as unassigned_tasks,
  avg(extract(epoch from (t.updated_at - t.created_at))/86400) as avg_task_duration_days,
  max(t.updated_at) as last_task_update
from public.projects p
left join public.project_tasks t on p.id = t.project_id
group by p.id, p.title, p.owner_id;

-- Kullanıcı bazında görev istatistikleri
create or replace view public.user_task_stats as
select 
  u.id as user_id,
  u.email,
  count(t.id) as total_tasks,
  count(t.id) filter (where t.status = 'todo') as todo_tasks,
  count(t.id) filter (where t.status = 'in_progress') as in_progress_tasks,
  count(t.id) filter (where t.status = 'review') as review_tasks,
  count(t.id) filter (where t.status = 'completed') as completed_tasks,
  count(t.id) filter (where t.priority = 'urgent') as urgent_tasks,
  count(t.id) filter (where t.priority = 'high') as high_priority_tasks,
  count(t.id) filter (where t.due_date < now() and t.status != 'completed') as overdue_tasks,
  count(t.id) filter (where t.created_by = u.id) as created_tasks,
  count(t.id) filter (where t.assigned_to = u.id) as assigned_tasks,
  avg(extract(epoch from (t.updated_at - t.created_at))/86400) as avg_task_duration_days,
  max(t.updated_at) as last_task_update
from auth.users u
left join public.project_tasks t on u.id = t.assigned_to or u.id = t.created_by
group by u.id, u.email;

-- Takım bazında görev istatistikleri
create or replace view public.team_task_stats as
select 
  tm.team_id,
  t.name as team_name,
  count(pt.id) as total_tasks,
  count(pt.id) filter (where pt.status = 'todo') as todo_tasks,
  count(pt.id) filter (where pt.status = 'in_progress') as in_progress_tasks,
  count(pt.id) filter (where pt.status = 'review') as review_tasks,
  count(pt.id) filter (where pt.status = 'completed') as completed_tasks,
  count(pt.id) filter (where pt.priority = 'urgent') as urgent_tasks,
  count(pt.id) filter (where pt.priority = 'high') as high_priority_tasks,
  count(pt.id) filter (where pt.due_date < now() and pt.status != 'completed') as overdue_tasks,
  count(distinct pt.assigned_to) as active_assignees,
  avg(extract(epoch from (pt.updated_at - pt.created_at))/86400) as avg_task_duration_days,
  max(pt.updated_at) as last_task_update
from public.teams t
join public.team_members tm on t.id = tm.team_id
join public.projects p on p.team_id = t.id
left join public.project_tasks pt on p.id = pt.project_id
group by tm.team_id, t.name;

-- Görev aktivite özeti
create or replace view public.task_activity_summary as
select 
  t.id as task_id,
  t.title as task_title,
  t.status,
  t.priority,
  p.title as project_title,
  p.id as project_id,
  count(tc.id) as comment_count,
  count(tf.id) as file_count,
  count(ta.id) as activity_count,
  max(tc.created_at) as last_comment_at,
  max(tf.created_at) as last_file_at,
  max(ta.created_at) as last_activity_at
from public.project_tasks t
join public.projects p on t.project_id = p.id
left join public.task_comments tc on t.id = tc.task_id
left join public.task_files tf on t.id = tf.task_id
left join public.task_activities ta on t.id = ta.task_id
group by t.id, t.title, t.status, t.priority, p.title, p.id;

-- Görev performans metrikleri
create or replace view public.task_performance_metrics as
select 
  p.id as project_id,
  p.title as project_title,
  count(t.id) as total_tasks,
  count(t.id) filter (where t.status = 'completed') as completed_tasks,
  round(
    (count(t.id) filter (where t.status = 'completed')::decimal / 
     nullif(count(t.id), 0) * 100), 2
  ) as completion_rate,
  avg(extract(epoch from (t.updated_at - t.created_at))/86400) as avg_completion_days,
  count(t.id) filter (where t.due_date < now() and t.status != 'completed') as overdue_tasks,
  round(
    (count(t.id) filter (where t.due_date < now() and t.status != 'completed')::decimal / 
     nullif(count(t.id), 0) * 100), 2
  ) as overdue_rate,
  count(t.id) filter (where t.priority = 'urgent' or t.priority = 'high') as high_priority_tasks,
  count(distinct t.assigned_to) as active_assignees,
  max(t.updated_at) as last_activity
from public.projects p
left join public.project_tasks t on p.id = t.project_id
group by p.id, p.title;
