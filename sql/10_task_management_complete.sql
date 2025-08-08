-- Görev Yönetimi Tam SQL Güncellemesi
-- Bu dosya tüm görev yönetimi özelliklerini içerir

-- ========================================
-- 1. PROFILES TABLOSU GÜNCELLEMESİ
-- ========================================

-- full_name alanını ekle (eğer yoksa)
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'profiles' 
    and column_name = 'full_name'
  ) then
    alter table public.profiles add column full_name text;
  end if;
end $$;

-- email alanını ekle (eğer yoksa)
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'profiles' 
    and column_name = 'email'
  ) then
    alter table public.profiles add column email text;
  end if;
end $$;

-- Mevcut kullanıcıların email bilgilerini güncelle
update public.profiles 
set email = auth.users.email 
from auth.users 
where profiles.id = auth.users.id 
and profiles.email is null;

-- Email için indeks ekle
create index if not exists idx_profiles_email on public.profiles(email);

-- Full name için indeks ekle
create index if not exists idx_profiles_full_name on public.profiles(full_name);

-- Email için unique constraint ekle (eğer yoksa)
do $$ 
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where table_name = 'profiles' 
    and constraint_name = 'profiles_email_unique'
  ) then
    alter table public.profiles add constraint profiles_email_unique unique (email);
  end if;
end $$;

-- ========================================
-- 2. GÖREV ATAMA TRIGGER FONKSİYONLARI
-- ========================================

-- Görev atandığında task_assignments tablosuna kayıt ekle
create or replace function handle_task_assignment()
returns trigger as $$
begin
  -- Eğer assigned_to değiştiyse
  if old.assigned_to is distinct from new.assigned_to then
    -- Eski atamaları sil
    if old.assigned_to is not null then
      delete from public.task_assignments 
      where task_id = new.id and user_id = old.assigned_to;
    end if;
    
    -- Yeni atama varsa ekle
    if new.assigned_to is not null then
      insert into public.task_assignments (task_id, user_id, assigned_by)
      values (new.id, new.assigned_to, auth.uid());
    end if;
    
    -- Aktivite kaydı ekle
    if new.assigned_to is not null then
      insert into public.task_activities (task_id, user_id, action, details)
      values (
        new.id, 
        auth.uid(), 
        'task_assigned', 
        jsonb_build_object(
          'assigned_to', new.assigned_to,
          'previous_assignee', old.assigned_to
        )
      );
    else
      insert into public.task_activities (task_id, user_id, action, details)
      values (
        new.id, 
        auth.uid(), 
        'task_unassigned', 
        jsonb_build_object(
          'previous_assignee', old.assigned_to
        )
      );
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Görev atama trigger'ı
drop trigger if exists task_assignment_trigger on public.project_tasks;
create trigger task_assignment_trigger
  after update on public.project_tasks
  for each row
  execute function handle_task_assignment();

-- Görev oluşturulduğunda otomatik atama
create or replace function handle_new_task_assignment()
returns trigger as $$
begin
  -- Eğer görev oluşturulurken assigned_to varsa
  if new.assigned_to is not null then
    -- Atama kaydı ekle
    insert into public.task_assignments (task_id, user_id, assigned_by)
    values (new.id, new.assigned_to, new.created_by);
    
    -- Aktivite kaydı ekle
    insert into public.task_activities (task_id, user_id, action, details)
    values (
      new.id, 
      new.created_by, 
      'task_created_with_assignment', 
      jsonb_build_object(
        'assigned_to', new.assigned_to
      )
    );
  else
    -- Sadece görev oluşturma aktivitesi
    insert into public.task_activities (task_id, user_id, action, details)
    values (
      new.id, 
      new.created_by, 
      'task_created', 
      jsonb_build_object(
        'title', new.title,
        'priority', new.priority,
        'status', new.status
      )
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Yeni görev oluşturma trigger'ı
drop trigger if exists new_task_assignment_trigger on public.project_tasks;
create trigger new_task_assignment_trigger
  after insert on public.project_tasks
  for each row
  execute function handle_new_task_assignment();

-- ========================================
-- 3. GÖREV GÜNCELLEME TRIGGER FONKSİYONLARI
-- ========================================

-- Görev güncellendiğinde aktivite kaydı ekle
create or replace function handle_task_update()
returns trigger as $$
declare
  changes jsonb := '{}'::jsonb;
begin
  -- Değişiklikleri tespit et
  if old.title is distinct from new.title then
    changes := changes || jsonb_build_object('title', jsonb_build_object('old', old.title, 'new', new.title));
  end if;
  
  if old.description is distinct from new.description then
    changes := changes || jsonb_build_object('description', jsonb_build_object('old', old.description, 'new', new.description));
  end if;
  
  if old.status is distinct from new.status then
    changes := changes || jsonb_build_object('status', jsonb_build_object('old', old.status, 'new', new.status));
  end if;
  
  if old.priority is distinct from new.priority then
    changes := changes || jsonb_build_object('priority', jsonb_build_object('old', old.priority, 'new', new.priority));
  end if;
  
  if old.due_date is distinct from new.due_date then
    changes := changes || jsonb_build_object('due_date', jsonb_build_object('old', old.due_date, 'new', new.due_date));
  end if;
  
  -- Eğer değişiklik varsa aktivite kaydı ekle
  if changes != '{}'::jsonb then
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

-- Görev güncelleme trigger'ı
drop trigger if exists task_update_trigger on public.project_tasks;
create trigger task_update_trigger
  after update on public.project_tasks
  for each row
  execute function handle_task_update();

-- Görev silindiğinde aktivite kaydı ekle
create or replace function handle_task_delete()
returns trigger as $$
begin
  -- Silme aktivitesi kaydı ekle
  insert into public.task_activities (task_id, user_id, action, details)
  values (
    old.id, 
    auth.uid(), 
    'task_deleted', 
    jsonb_build_object(
      'title', old.title,
      'status', old.status,
      'priority', old.priority
    )
  );
  
  return old;
end;
$$ language plpgsql security definer;

-- Görev silme trigger'ı
drop trigger if exists task_delete_trigger on public.project_tasks;
create trigger task_delete_trigger
  before delete on public.project_tasks
  for each row
  execute function handle_task_delete();

-- ========================================
-- 4. YARDIMCI FONKSİYONLAR
-- ========================================

-- Görev detaylarını getiren fonksiyon
create or replace function get_task_details(task_uuid uuid)
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
  assignee_name text,
  assignee_email text,
  creator_name text,
  creator_email text
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
    assignee.full_name as assignee_name,
    assignee.email as assignee_email,
    creator.full_name as creator_name,
    creator.email as creator_email
  from public.project_tasks t
  left join public.projects p on t.project_id = p.id
  left join public.profiles assignee on t.assigned_to = assignee.id
  left join public.profiles creator on t.created_by = creator.id
  where t.id = task_uuid;
end;
$$ language plpgsql security definer;

-- Görev arama fonksiyonu
create or replace function search_tasks(
  search_term text default null,
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
  due_date timestamptz,
  project_title text,
  assignee_name text
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
    t.due_date,
    p.title as project_title,
    assignee.full_name as assignee_name
  from public.project_tasks t
  left join public.projects p on t.project_id = p.id
  left join public.profiles assignee on t.assigned_to = assignee.id
  where (search_term is null or 
         t.title ilike '%' || search_term || '%' or 
         t.description ilike '%' || search_term || '%')
    and (project_id_filter is null or t.project_id = project_id_filter)
    and (status_filter is null or t.status = status_filter)
    and (priority_filter is null or t.priority = priority_filter)
    and (assigned_to_filter is null or t.assigned_to = assigned_to_filter)
  order by 
    case t.priority 
      when 'urgent' then 1 
      when 'high' then 2 
      when 'medium' then 3 
      when 'low' then 4 
    end,
    t.due_date asc nulls last;
end;
$$ language plpgsql security definer;

-- Görev istatistikleri fonksiyonu
create or replace function get_task_statistics(project_uuid uuid default null)
returns table (
  total_tasks bigint,
  completed_tasks bigint,
  in_progress_tasks bigint,
  todo_tasks bigint,
  review_tasks bigint,
  overdue_tasks bigint,
  urgent_tasks bigint,
  high_priority_tasks bigint
) as $$
begin
  return query
  select 
    count(*) as total_tasks,
    count(*) filter (where status = 'completed') as completed_tasks,
    count(*) filter (where status = 'in_progress') as in_progress_tasks,
    count(*) filter (where status = 'todo') as todo_tasks,
    count(*) filter (where status = 'review') as review_tasks,
    count(*) filter (where due_date < now() and status != 'completed') as overdue_tasks,
    count(*) filter (where priority = 'urgent') as urgent_tasks,
    count(*) filter (where priority = 'high') as high_priority_tasks
  from public.project_tasks
  where project_uuid is null or project_id = project_uuid;
end;
$$ language plpgsql security definer;
