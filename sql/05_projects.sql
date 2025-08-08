-- Proje yönetimi tabloları ve RLS politikaları
-- Bu dosya proje oluşturma, düzenleme ve yönetimi için gerekli tüm yapıları içerir

-- Projeler tablosu
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  team_id uuid references public.teams(id) on delete set null,
  status text default 'active' check (status in ('active', 'archived', 'completed')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Eksik sütunları ekle (eğer tablo zaten varsa)
do $$ begin
  -- team_id sütunu ekle
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'team_id'
  ) then
    alter table public.projects add column team_id uuid references public.teams(id) on delete set null;
  end if;
  
  -- status sütunu ekle
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'status'
  ) then
    alter table public.projects add column status text default 'active' check (status in ('active', 'archived', 'completed'));
  end if;
  
  -- updated_at sütunu ekle
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'updated_at'
  ) then
    alter table public.projects add column updated_at timestamptz default now() not null;
  end if;
end $$;

-- Proje üyeleri tablosu (proje paylaşımı için)
create table if not exists public.project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz default now() not null,
  unique(project_id, user_id)
);

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

-- Proje dosyaları tablosu
create table if not exists public.project_files (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  file_type text not null,
  uploaded_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- Proje yorumları tablosu
create table if not exists public.project_comments (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  task_id uuid references public.project_tasks(id) on delete cascade,
  content text not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- İndeksler
create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_projects_team_id on public.projects(team_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_project_members_project_id on public.project_members(project_id);
create index if not exists idx_project_members_user_id on public.project_members(user_id);
create index if not exists idx_project_tasks_project_id on public.project_tasks(project_id);
create index if not exists idx_project_tasks_assigned_to on public.project_tasks(assigned_to);
create index if not exists idx_project_tasks_status on public.project_tasks(status);
create index if not exists idx_project_files_project_id on public.project_files(project_id);
create index if not exists idx_project_comments_project_id on public.project_comments(project_id);
create index if not exists idx_project_comments_task_id on public.project_comments(task_id);

-- RLS'yi etkinleştir
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_files enable row level security;
alter table public.project_comments enable row level security;

-- Projeler için RLS politikaları
do $$ begin
  -- read own projects policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'projects' and policyname = 'read own projects'
  ) then
    create policy "read own projects" on public.projects
      for select using (
        owner_id = auth.uid() or
        id in (
          select project_id from public.project_members where user_id = auth.uid()
        ) or
        team_id in (
          select team_id from public.team_members where user_id = auth.uid()
        )
      );
  end if;

  -- create projects policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'projects' and policyname = 'create projects'
  ) then
    create policy "create projects" on public.projects
      for insert with check (owner_id = auth.uid());
  end if;

  -- update own projects policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'projects' and policyname = 'update own projects'
  ) then
    create policy "update own projects" on public.projects
      for update using (
        owner_id = auth.uid() or
        id in (
          select project_id from public.project_members 
          where user_id = auth.uid() and role in ('owner', 'admin')
        )
      );
  end if;

  -- delete own projects policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'projects' and policyname = 'delete own projects'
  ) then
    create policy "delete own projects" on public.projects
      for delete using (owner_id = auth.uid());
  end if;
end $$;

-- Proje üyeleri için RLS politikaları
do $$ begin
  -- read project members policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_members' and policyname = 'read project members'
  ) then
    create policy "read project members" on public.project_members
      for select using (
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        ) or
        user_id = auth.uid()
      );
  end if;

  -- insert project members policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_members' and policyname = 'insert project members'
  ) then
    create policy "insert project members" on public.project_members
      for insert with check (
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        )
      );
  end if;

  -- update project members policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_members' and policyname = 'update project members'
  ) then
    create policy "update project members" on public.project_members
      for update using (
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        ) or
        user_id = auth.uid()
      );
  end if;

  -- delete project members policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_members' and policyname = 'delete project members'
  ) then
    create policy "delete project members" on public.project_members
      for delete using (
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        ) or
        user_id = auth.uid()
      );
  end if;
end $$;

-- Proje görevleri için RLS politikaları
do $$ begin
  -- read project tasks policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'read project tasks'
  ) then
    create policy "read project tasks" on public.project_tasks
      for select using (
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        ) or
        created_by = auth.uid() or
        assigned_to = auth.uid()
      );
  end if;

  -- create project tasks policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'create project tasks'
  ) then
    create policy "create project tasks" on public.project_tasks
      for insert with check (
        created_by = auth.uid() and
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        )
      );
  end if;

  -- update project tasks policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'update project tasks'
  ) then
    create policy "update project tasks" on public.project_tasks
      for update using (
        created_by = auth.uid() or
        assigned_to = auth.uid() or
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        )
      );
  end if;

  -- delete project tasks policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'delete project tasks'
  ) then
    create policy "delete project tasks" on public.project_tasks
      for delete using (
        created_by = auth.uid() or
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        )
      );
  end if;
end $$;

-- Proje dosyaları için RLS politikaları
do $$ begin
  -- read project files policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_files' and policyname = 'read project files'
  ) then
    create policy "read project files" on public.project_files
      for select using (
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        ) or
        uploaded_by = auth.uid()
      );
  end if;

  -- upload project files policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_files' and policyname = 'upload project files'
  ) then
    create policy "upload project files" on public.project_files
      for insert with check (
        uploaded_by = auth.uid() and
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        )
      );
  end if;

  -- delete project files policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_files' and policyname = 'delete project files'
  ) then
    create policy "delete project files" on public.project_files
      for delete using (
        uploaded_by = auth.uid() or
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        )
      );
  end if;
end $$;

-- Proje yorumları için RLS politikaları
do $$ begin
  -- read project comments policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_comments' and policyname = 'read project comments'
  ) then
    create policy "read project comments" on public.project_comments
      for select using (
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        ) or
        created_by = auth.uid()
      );
  end if;

  -- create project comments policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_comments' and policyname = 'create project comments'
  ) then
    create policy "create project comments" on public.project_comments
      for insert with check (
        created_by = auth.uid() and
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        )
      );
  end if;

  -- update own comments policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_comments' and policyname = 'update own comments'
  ) then
    create policy "update own comments" on public.project_comments
      for update using (created_by = auth.uid());
  end if;

  -- delete own comments policy
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_comments' and policyname = 'delete own comments'
  ) then
    create policy "delete own comments" on public.project_comments
      for delete using (
        created_by = auth.uid() or
        project_id in (
          select id from public.projects where owner_id = auth.uid()
        )
      );
  end if;
end $$;

-- Trigger fonksiyonları
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger'ları oluştur
do $$ begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_projects_updated_at' and tgrelid = 'public.projects'::regclass
  ) then
    create trigger handle_projects_updated_at
      before update on public.projects
      for each row
      execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
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

do $$ begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_project_comments_updated_at' and tgrelid = 'public.project_comments'::regclass
  ) then
    create trigger handle_project_comments_updated_at
      before update on public.project_comments
      for each row
      execute function public.handle_updated_at();
  end if;
end $$;

-- Proje oluşturulduğunda otomatik olarak sahibini üye yap
create or replace function public.handle_new_project()
returns trigger as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_new_project_trigger' and tgrelid = 'public.projects'::regclass
  ) then
    create trigger handle_new_project_trigger
      after insert on public.projects
      for each row
      execute function public.handle_new_project();
  end if;
end $$;

-- Yardımcı fonksiyonlar
create or replace function public.get_user_projects(user_uuid uuid)
returns table (
  id uuid,
  title text,
  description text,
  team_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  is_owner boolean,
  user_role text
) as $$
begin
  return query
  select 
    p.id,
    p.title,
    p.description,
    p.team_id,
    p.status,
    p.created_at,
    p.updated_at,
    (p.owner_id = user_uuid) as is_owner,
    coalesce(pm.role, 'none') as user_role
  from public.projects p
  left join public.project_members pm on p.id = pm.project_id and pm.user_id = user_uuid
  where p.owner_id = user_uuid or pm.user_id = user_uuid
  order by p.updated_at desc;
end;
$$ language plpgsql security definer;

-- Proje istatistikleri fonksiyonu
create or replace function public.get_project_stats(project_uuid uuid)
returns table (
  total_tasks bigint,
  completed_tasks bigint,
  in_progress_tasks bigint,
  todo_tasks bigint,
  total_members bigint,
  total_files bigint
) as $$
begin
  return query
  select 
    count(t.id) as total_tasks,
    count(t.id) filter (where t.status = 'completed') as completed_tasks,
    count(t.id) filter (where t.status = 'in_progress') as in_progress_tasks,
    count(t.id) filter (where t.status = 'todo') as todo_tasks,
    count(pm.id) as total_members,
    count(pf.id) as total_files
  from public.projects p
  left join public.project_tasks t on p.id = t.project_id
  left join public.project_members pm on p.id = pm.project_id
  left join public.project_files pf on p.id = pf.project_id
  where p.id = project_uuid
  group by p.id;
end;
$$ language plpgsql security definer;
