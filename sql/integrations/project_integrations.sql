-- Project-level integrations mapping
create table if not exists public.project_integrations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null check (provider in ('github','google_calendar','slack')),
  repo_full_name text, -- for github: owner/repo
  repo_id bigint,
  default_branch text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, provider)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_project_integrations_set_updated on public.project_integrations;
create trigger trg_project_integrations_set_updated
before update on public.project_integrations
for each row execute function public.set_updated_at();

-- RLS can be added later; routes use admin with explicit auth checks

