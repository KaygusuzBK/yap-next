-- Görev yönetimi tabloları
-- Bu dosya görev oluşturma, düzenleme ve yönetimi için gerekli tüm yapıları içerir

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
