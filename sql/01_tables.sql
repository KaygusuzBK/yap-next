-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Re-create trigger safely (Postgres doesn't support IF NOT EXISTS for triggers)
drop trigger if exists set_timestamp_profiles on public.profiles;
create trigger set_timestamp_profiles
before update on public.profiles
for each row execute function public.trigger_set_timestamp();

-- Example: projects owned by a user
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Re-create trigger safely
drop trigger if exists set_timestamp_projects on public.projects;
create trigger set_timestamp_projects
before update on public.projects
for each row execute function public.trigger_set_timestamp();


