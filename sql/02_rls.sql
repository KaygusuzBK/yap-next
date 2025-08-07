-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- Profiles policies: users can see and update only their own profile
create policy if not exists "read own profile"
on public.profiles for select
using (auth.uid() = id);

create policy if not exists "update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Projects policies: owners have full access, authenticated users can insert their own
create policy if not exists "read own projects"
on public.projects for select
using (owner_id = auth.uid());

create policy if not exists "insert own projects"
on public.projects for insert
with check (owner_id = auth.uid());

create policy if not exists "update own projects"
on public.projects for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy if not exists "delete own projects"
on public.projects for delete
using (owner_id = auth.uid());


