-- GÜVENLİ RLS DÜZELTME - Adım adım, hata riski minimum
-- Bu script Supabase SQL Editor'de çalıştırılmalı

-- 1. ÖNCE MEVCUT DURUMU KONTROL ET
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. SADECE TEMEL TABLOLARDA RLS AKTİF ET (güvenli başlangıç)
-- Önce en kritik tabloları aktif edelim

-- PROFILES - En güvenli, kullanıcı sadece kendi profilini görür
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
DROP POLICY IF EXISTS "update own profile" ON public.profiles;

-- Yeni temiz politikalar
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TEAMS - Takım yönetimi
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "teams_select_owner" ON public.teams;
DROP POLICY IF EXISTS "teams_select_member" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_owner" ON public.teams;
DROP POLICY IF EXISTS "teams_update_owner" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_owner" ON public.teams;
DROP POLICY IF EXISTS "create teams" ON public.teams;
DROP POLICY IF EXISTS "delete own teams" ON public.teams;
DROP POLICY IF EXISTS "read member teams" ON public.teams;
DROP POLICY IF EXISTS "read own teams" ON public.teams;
DROP POLICY IF EXISTS "update own teams" ON public.teams;

-- Yeni temiz politikalar
CREATE POLICY "teams_select_owner" ON public.teams FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "teams_select_member" ON public.teams FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = teams.id AND user_id = auth.uid())
);
CREATE POLICY "teams_insert_owner" ON public.teams FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "teams_update_owner" ON public.teams FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "teams_delete_owner" ON public.teams FOR DELETE USING (owner_id = auth.uid());

-- TEAM_MEMBERS - Takım üyeleri
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "team_members_select_owner" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_owner" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_owner" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_owner" ON public.team_members;

-- Yeni temiz politikalar
CREATE POLICY "team_members_select_owner" ON public.team_members FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_members_insert_owner" ON public.team_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_members_update_owner" ON public.team_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_members_delete_owner" ON public.team_members FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
);

-- TEAM_INVITATIONS - Takım davetleri
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "team_invitations_select_owner" ON public.team_invitations;
DROP POLICY IF EXISTS "team_invitations_select_invited" ON public.team_invitations;
DROP POLICY IF EXISTS "team_invitations_insert_owner" ON public.team_invitations;
DROP POLICY IF EXISTS "team_invitations_update_owner" ON public.team_invitations;
DROP POLICY IF EXISTS "team_invitations_delete_owner" ON public.team_invitations;

-- Yeni temiz politikalar
CREATE POLICY "team_invitations_select_owner" ON public.team_invitations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_invitations.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_invitations_select_invited" ON public.team_invitations FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "team_invitations_insert_owner" ON public.team_invitations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_invitations.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_invitations_update_owner" ON public.team_invitations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_invitations.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_invitations_delete_owner" ON public.team_invitations FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_invitations.team_id AND owner_id = auth.uid())
);

-- 3. SONUÇLARI KONTROL ET
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'teams', 'team_members', 'team_invitations')
ORDER BY tablename;
