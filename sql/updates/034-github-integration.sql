-- GitHub entegrasyonu – Faz 1 temel şema
-- Tablolar: github_installations, project_github_links, task_github_links, github_events_log

create table if not exists public.github_installations (
  id uuid default gen_random_uuid() primary key,
  installation_id bigint not null,
  account_login text not null,
  created_at timestamptz default now() not null
);

create table if not exists public.project_github_links (
  project_id uuid references public.projects(id) on delete cascade not null,
  repo_owner text not null,
  repo_name text not null,
  installation_id bigint not null,
  created_at timestamptz default now() not null,
  primary key (project_id, repo_owner, repo_name)
);

create table if not exists public.task_github_links (
  task_id uuid references public.project_tasks(id) on delete cascade not null,
  repo_owner text not null,
  repo_name text not null,
  issue_number int,
  pull_number int,
  type text check (type in ('issue','pull')),
  created_at timestamptz default now() not null,
  unique (task_id, repo_owner, repo_name, coalesce(issue_number, -1), coalesce(pull_number, -1))
);

create table if not exists public.github_events_log (
  id uuid default gen_random_uuid() primary key,
  delivery_id text not null,
  event text not null,
  payload jsonb not null,
  processed_at timestamptz default now() not null,
  unique(delivery_id)
);

-- Index önerileri
create index if not exists idx_task_github_links_issue on public.task_github_links(repo_owner, repo_name, issue_number);
create index if not exists idx_task_github_links_pull on public.task_github_links(repo_owner, repo_name, pull_number);


