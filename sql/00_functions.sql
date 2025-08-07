-- Functions and helpers (Supabase-ready)

-- Ensure pgcrypto is available for gen_random_uuid()
create extension if not exists "pgcrypto" with schema extensions;

-- Timestamp update trigger
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- When a team is created, add the owner as a team member (role=owner)
create or replace function public.handle_new_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (team_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

-- Handle new auth user -> create profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Attach trigger to auth.users to auto-create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


