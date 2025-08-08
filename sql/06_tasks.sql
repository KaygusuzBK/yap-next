-- Görev yönetimi ana SQL dosyası
-- Bu dosya görev yönetimi için gerekli tüm yapıları içerir

-- Tabloları oluştur
\i sql/tables/tasks.sql

-- İndeksleri oluştur
\i sql/indexes/tasks.sql

-- RLS politikalarını oluştur
\i sql/policies/tasks.sql

-- Trigger fonksiyonlarını oluştur
\i sql/functions/task_triggers.sql

-- Trigger'ları oluştur
\i sql/triggers/task_triggers.sql

-- View'ları oluştur
\i sql/views/task_stats.sql

-- Yardımcı fonksiyonlar
create or replace function public.get_task_details(task_uuid uuid)
returns table (
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  assigned_to uuid,
  created_by uuid,
  due_date timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  project_title text,
  project_id uuid,
  assignee_email text,
  creator_email text,
  comment_count bigint,
  file_count bigint,
  activity_count bigint
) as $$
begin
  return query
  select 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.assigned_to,
    t.created_by,
    t.due_date,
    t.created_at,
    t.updated_at,
    p.title as project_title,
    p.id as project_id,
    assignee.email as assignee_email,
    creator.email as creator_email,
    count(tc.id) as comment_count,
    count(tf.id) as file_count,
    count(ta.id) as activity_count
  from public.project_tasks t
  join public.projects p on t.project_id = p.id
  left join auth.users assignee on t.assigned_to = assignee.id
  left join auth.users creator on t.created_by = creator.id
  left join public.task_comments tc on t.id = tc.task_id
  left join public.task_files tf on t.id = tf.task_id
  left join public.task_activities ta on t.id = ta.task_id
  where t.id = task_uuid
  group by t.id, t.title, t.description, t.status, t.priority, t.assigned_to, t.created_by, 
           t.due_date, t.created_at, t.updated_at, p.title, p.id, assignee.email, creator.email;
end;
$$ language plpgsql security definer;

-- Görev arama fonksiyonu
create or replace function public.search_tasks(
  search_term text,
  project_id_filter uuid default null,
  status_filter text default null,
  priority_filter text default null,
  assigned_to_filter uuid default null
)
returns table (
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  assigned_to uuid,
  created_by uuid,
  due_date timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  project_title text,
  project_id uuid,
  assignee_email text,
  creator_email text,
  search_rank real
) as $$
begin
  return query
  select 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.assigned_to,
    t.created_by,
    t.due_date,
    t.created_at,
    t.updated_at,
    p.title as project_title,
    p.id as project_id,
    assignee.email as assignee_email,
    creator.email as creator_email,
    ts_rank(
      to_tsvector('turkish', coalesce(t.title, '') || ' ' || coalesce(t.description, '')),
      plainto_tsquery('turkish', search_term)
    ) as search_rank
  from public.project_tasks t
  join public.projects p on t.project_id = p.id
  left join auth.users assignee on t.assigned_to = assignee.id
  left join auth.users creator on t.created_by = creator.id
  where 
    (search_term is null or 
     to_tsvector('turkish', coalesce(t.title, '') || ' ' || coalesce(t.description, '')) @@ 
     plainto_tsquery('turkish', search_term))
    and (project_id_filter is null or t.project_id = project_id_filter)
    and (status_filter is null or t.status = status_filter)
    and (priority_filter is null or t.priority = priority_filter)
    and (assigned_to_filter is null or t.assigned_to = assigned_to_filter)
    and p.id in (
      select id from public.projects 
      where owner_id = auth.uid() or 
            id in (select project_id from public.project_members where user_id = auth.uid())
    )
  order by search_rank desc nulls last, t.updated_at desc;
end;
$$ language plpgsql security definer;

-- Görev istatistikleri fonksiyonu
create or replace function public.get_task_statistics(
  project_id_filter uuid default null,
  user_id_filter uuid default null,
  team_id_filter uuid default null
)
returns table (
  total_tasks bigint,
  todo_tasks bigint,
  in_progress_tasks bigint,
  review_tasks bigint,
  completed_tasks bigint,
  urgent_tasks bigint,
  high_priority_tasks bigint,
  overdue_tasks bigint,
  assigned_tasks bigint,
  unassigned_tasks bigint,
  completion_rate decimal,
  avg_duration_days decimal
) as $$
begin
  return query
  select 
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
    round(
      (count(t.id) filter (where t.status = 'completed')::decimal / 
       nullif(count(t.id), 0) * 100), 2
    ) as completion_rate,
    avg(extract(epoch from (t.updated_at - t.created_at))/86400) as avg_duration_days
  from public.project_tasks t
  join public.projects p on t.project_id = p.id
  where 
    (project_id_filter is null or t.project_id = project_id_filter)
    and (user_id_filter is null or t.assigned_to = user_id_filter or t.created_by = user_id_filter)
    and (team_id_filter is null or p.team_id = team_id_filter)
    and p.id in (
      select id from public.projects 
      where owner_id = auth.uid() or 
            id in (select project_id from public.project_members where user_id = auth.uid())
    );
end;
$$ language plpgsql security definer;
