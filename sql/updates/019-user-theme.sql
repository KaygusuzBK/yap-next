-- Add per-user theme customization storage
alter table if exists public.user_preferences
  add column if not exists theme jsonb;

-- Optional index for querying by users with theme set
create index if not exists idx_user_preferences_theme on public.user_preferences using gin (theme);


