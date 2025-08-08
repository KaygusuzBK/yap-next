-- Profiles tablosunu güncelleme
-- full_name ve email alanlarını ekle

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
