# Database setup (Supabase)

This folder contains SQL files to bootstrap the project database on Supabase.

## Files
- 00_functions.sql: helper functions and triggers (updated_at trigger, profile auto-create)
- 01_tables.sql: tables (profiles, projects) and timestamp triggers
- 02_rls.sql: Row Level Security (RLS) policies for profiles and projects
- 03_tasks.sql: tasks table + timestamp trigger + RLS (inherits project ownership)
- 04_teams.sql: teams, team_members, team_invitations; projects -> team_id; team-based RLS for projects

## Apply order
1) 00_functions.sql
2) 01_tables.sql
3) 02_rls.sql
4) 03_tasks.sql
5) 04_teams.sql

## How to apply

### Option A — Supabase SQL Editor (recommended)
1. Open Supabase Dashboard → SQL Editor
2. Paste and run each file in the order above

### Option B — psql (local Postgres connection)
1. Set your connection string (example):

   export DATABASE_URL="postgres://user:pass@host:5432/dbname"

2. Run the helper script:

   bash sql/apply.sh

The script will apply files in the correct order and stop on errors.

## Notes
- `profiles` is auto-created for each new auth user (trigger on `auth.users`).
- RLS ensures users only access their own/profile team’s projects and tasks.
- Requires `pgcrypto` (available by default on Supabase) for `gen_random_uuid()`.
