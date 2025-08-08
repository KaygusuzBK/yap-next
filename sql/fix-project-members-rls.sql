-- project_members tablosundaki sonsuz döngü sorununu çöz
-- Bu dosya sadece bu sorunu çözmek için kullanılır

-- Önce mevcut tüm politikaları temizle
drop policy if exists "project_members_policy" on public.project_members;
drop policy if exists "read_project_members" on public.project_members;
drop policy if exists "insert_project_members" on public.project_members;
drop policy if exists "update_project_members" on public.project_members;
drop policy if exists "delete_project_members" on public.project_members;
drop policy if exists "project_members_simple_policy" on public.project_members;

-- RLS'yi geçici olarak devre dışı bırak
alter table public.project_members disable row level security;

-- Alternatif olarak, çok basit bir politika oluştur (eğer RLS gerekliyse)
-- alter table public.project_members enable row level security;
-- create policy "project_members_basic_policy" on public.project_members
--   for all using (true);
