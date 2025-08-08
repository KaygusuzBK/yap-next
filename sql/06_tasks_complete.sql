-- Görev yönetimi tam SQL dosyası
-- Bu dosya görev yönetimi için gerekli tüm yapıları içerir

-- ========================================
-- TABLOLAR
-- ========================================

-- Proje görevleri tablosu
create table if not exists public.project_tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'review', 'completed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete cascade not null,
  due_date timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Görev atamaları tablosu (çoklu atama için)
create table if not exists public.task_assignments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.project_tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  assigned_by uuid references auth.users(id) on delete cascade not null,
  assigned_at timestamptz default now() not null,
  unique(task_id, user_id)
);

-- Görev yorumları tablosu
create table if not exists public.task_comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.project_tasks(id) on delete cascade not null,
  content text not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Görev zaman takibi tablosu
create table if not exists public.task_time_logs (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.project_tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  start_time timestamptz not null,
  end_time timestamptz,
  description text,
  created_at timestamptz default now() not null
);

-- Görev etiketleri tablosu
create table if not exists public.task_tags (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  color text default '#3b82f6',
  created_at timestamptz default now() not null
);

-- Görev-etiket ilişki tablosu
create table if not exists public.task_tag_relations (
  task_id uuid references public.project_tasks(id) on delete cascade not null,
  tag_id uuid references public.task_tags(id) on delete cascade not null,
  primary key (task_id, tag_id)
);

-- Görev dosyaları tablosu
create table if not exists public.task_files (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.project_tasks(id) on delete cascade not null,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  file_type text not null,
  uploaded_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- Görev aktiviteleri tablosu (audit log)
create table if not exists public.task_activities (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.project_tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  details jsonb,
  created_at timestamptz default now() not null
);

-- ========================================
-- İNDEKSLER
-- ========================================

-- project_tasks tablosu indeksleri
create index if not exists idx_project_tasks_project_id on public.project_tasks(project_id);
create index if not exists idx_project_tasks_assigned_to on public.project_tasks(assigned_to);
create index if not exists idx_project_tasks_created_by on public.project_tasks(created_by);
create index if not exists idx_project_tasks_status on public.project_tasks(status);
create index if not exists idx_project_tasks_priority on public.project_tasks(priority);
create index if not exists idx_project_tasks_due_date on public.project_tasks(due_date);
create index if not exists idx_project_tasks_created_at on public.project_tasks(created_at);
create index if not exists idx_project_tasks_updated_at on public.project_tasks(updated_at);

-- Composite indeksler
create index if not exists idx_project_tasks_project_status on public.project_tasks(project_id, status);
create index if not exists idx_project_tasks_project_priority on public.project_tasks(project_id, priority);
create index if not exists idx_project_tasks_assigned_status on public.project_tasks(assigned_to, status);
create index if not exists idx_project_tasks_due_date_status on public.project_tasks(due_date, status);

-- task_assignments tablosu indeksleri
create index if not exists idx_task_assignments_task_id on public.task_assignments(task_id);
create index if not exists idx_task_assignments_user_id on public.task_assignments(user_id);
create index if not exists idx_task_assignments_assigned_by on public.task_assignments(assigned_by);
create index if not exists idx_task_assignments_assigned_at on public.task_assignments(assigned_at);

-- task_comments tablosu indeksleri
create index if not exists idx_task_comments_task_id on public.task_comments(task_id);
create index if not exists idx_task_comments_created_by on public.task_comments(created_by);
create index if not exists idx_task_comments_created_at on public.task_comments(created_at);

-- task_time_logs tablosu indeksleri
create index if not exists idx_task_time_logs_task_id on public.task_time_logs(task_id);
create index if not exists idx_task_time_logs_user_id on public.task_time_logs(user_id);
create index if not exists idx_task_time_logs_start_time on public.task_time_logs(start_time);
create index if not exists idx_task_time_logs_end_time on public.task_time_logs(end_time);

-- task_tag_relations tablosu indeksleri
create index if not exists idx_task_tag_relations_task_id on public.task_tag_relations(task_id);
create index if not exists idx_task_tag_relations_tag_id on public.task_tag_relations(tag_id);

-- task_files tablosu indeksleri
create index if not exists idx_task_files_task_id on public.task_files(task_id);
create index if not exists idx_task_files_uploaded_by on public.task_files(uploaded_by);
create index if not exists idx_task_files_created_at on public.task_files(created_at);

-- task_activities tablosu indeksleri
create index if not exists idx_task_activities_task_id on public.task_activities(task_id);
create index if not exists idx_task_activities_user_id on public.task_activities(user_id);
create index if not exists idx_task_activities_action on public.task_activities(action);
create index if not exists idx_task_activities_created_at on public.task_activities(created_at);

-- Full-text search indeksleri
create index if not exists idx_project_tasks_title_fts on public.project_tasks using gin(to_tsvector('turkish', title));
create index if not exists idx_project_tasks_description_fts on public.project_tasks using gin(to_tsvector('turkish', description));
create index if not exists idx_task_comments_content_fts on public.task_comments using gin(to_tsvector('turkish', content));

-- ========================================
-- RLS POLİTİKALARI
-- ========================================

-- RLS'yi etkinleştir
alter table public.project_tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_time_logs enable row level security;
alter table public.task_files enable row level security;
alter table public.task_activities enable row level security;

-- project_tasks tablosu için politikalar
do $$ begin
  -- Görevleri okuyabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'read_project_tasks'
  ) then
    create policy "read_project_tasks" on public.project_tasks
      for select using (
        project_id in (
          select id from public.projects 
          where owner_id = auth.uid() or 
                id in (select project_id from public.project_members where user_id = auth.uid())
        )
      );
  end if;

  -- Görev oluşturabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'create_project_tasks'
  ) then
    create policy "create_project_tasks" on public.project_tasks
      for insert with check (
        project_id in (
          select id from public.projects 
          where owner_id = auth.uid() or 
                id in (select project_id from public.project_members where user_id = auth.uid())
        ) and
        created_by = auth.uid()
      );
  end if;

  -- Görev güncelleyebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'update_project_tasks'
  ) then
    create policy "update_project_tasks" on public.project_tasks
      for update using (
        project_id in (
          select id from public.projects 
          where owner_id = auth.uid() or 
                id in (select project_id from public.project_members where user_id = auth.uid())
        )
      );
  end if;

  -- Görev silebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'delete_project_tasks'
  ) then
    create policy "delete_project_tasks" on public.project_tasks
      for delete using (
        project_id in (
          select id from public.projects 
          where owner_id = auth.uid()
        ) or
        created_by = auth.uid()
      );
  end if;
end $$;

-- task_comments tablosu için politikalar
do $$ begin
  -- Yorum okuyabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_comments' and policyname = 'read_task_comments'
  ) then
    create policy "read_task_comments" on public.task_comments
      for select using (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid())
          )
        )
      );
  end if;

  -- Yorum oluşturabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_comments' and policyname = 'create_task_comments'
  ) then
    create policy "create_task_comments" on public.task_comments
      for insert with check (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid())
          )
        ) and
        created_by = auth.uid()
      );
  end if;

  -- Yorum güncelleyebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_comments' and policyname = 'update_task_comments'
  ) then
    create policy "update_task_comments" on public.task_comments
      for update using (created_by = auth.uid());
  end if;

  -- Yorum silebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_comments' and policyname = 'delete_task_comments'
  ) then
    create policy "delete_task_comments" on public.task_comments
      for delete using (
        created_by = auth.uid() or
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid()
          )
        )
      );
  end if;
end $$;

-- ========================================
-- TRIGGER FONKSİYONLARI
-- ========================================

-- Görev oluşturulduğunda aktivite kaydı oluştur
create or replace function public.handle_new_task()
returns trigger as $$
begin
  insert into public.task_activities (task_id, user_id, action, details)
  values (
    new.id, 
    new.created_by, 
    'task_created',
    jsonb_build_object(
      'title', new.title,
      'status', new.status,
      'priority', new.priority
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Görev güncellendiğinde aktivite kaydı oluştur
create or replace function public.handle_task_update()
returns trigger as $$
declare
  changes jsonb := '{}';
begin
  -- Değişiklikleri tespit et
  if old.title != new.title then
    changes := changes || jsonb_build_object('title', jsonb_build_object('old', old.title, 'new', new.title));
  end if;
  
  if old.description is distinct from new.description then
    changes := changes || jsonb_build_object('description', jsonb_build_object('old', old.description, 'new', new.description));
  end if;
  
  if old.status != new.status then
    changes := changes || jsonb_build_object('status', jsonb_build_object('old', old.status, 'new', new.status));
  end if;
  
  if old.priority != new.priority then
    changes := changes || jsonb_build_object('priority', jsonb_build_object('old', old.priority, 'new', new.priority));
  end if;
  
  if old.assigned_to is distinct from new.assigned_to then
    changes := changes || jsonb_build_object('assigned_to', jsonb_build_object('old', old.assigned_to, 'new', new.assigned_to));
  end if;
  
  if old.due_date is distinct from new.due_date then
    changes := changes || jsonb_build_object('due_date', jsonb_build_object('old', old.due_date, 'new', new.due_date));
  end if;
  
  -- Eğer değişiklik varsa aktivite kaydı oluştur
  if changes != '{}' then
    insert into public.task_activities (task_id, user_id, action, details)
    values (
      new.id, 
      auth.uid(), 
      'task_updated',
      changes
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- ========================================
-- TRIGGER'LAR
-- ========================================

-- project_tasks tablosu trigger'ları
do $$ begin
  -- Görev oluşturulduğunda aktivite kaydı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_new_task_trigger' and tgrelid = 'public.project_tasks'::regclass
  ) then
    create trigger handle_new_task_trigger
      after insert on public.project_tasks
      for each row
      execute function public.handle_new_task();
  end if;

  -- Görev güncellendiğinde aktivite kaydı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_task_update_trigger' and tgrelid = 'public.project_tasks'::regclass
  ) then
    create trigger handle_task_update_trigger
      after update on public.project_tasks
      for each row
      execute function public.handle_task_update();
  end if;

  -- Görev updated_at trigger'ı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_project_tasks_updated_at' and tgrelid = 'public.project_tasks'::regclass
  ) then
    create trigger handle_project_tasks_updated_at
      before update on public.project_tasks
      for each row
      execute function public.handle_updated_at();
  end if;
end $$;

-- ========================================
-- VIEW'LAR
-- ========================================

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

-- ========================================
-- YARDIMCI FONKSİYONLAR
-- ========================================

-- Görev detayları fonksiyonu
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
