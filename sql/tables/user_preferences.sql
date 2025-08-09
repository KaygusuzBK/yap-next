create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slack_webhook_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.user_preferences enable row level security;

do $$ begin
  create policy "select own prefs" on public.user_preferences
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insert own prefs" on public.user_preferences
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "update own prefs" on public.user_preferences
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at_prefs()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger trg_user_prefs_updated
  before update on public.user_preferences
  for each row execute function public.set_updated_at_prefs();
exception when duplicate_object then null; end $$;


