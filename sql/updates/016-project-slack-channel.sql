-- Add slack_channel_id to projects
alter table if exists public.projects
  add column if not exists slack_channel_id text;

comment on column public.projects.slack_channel_id is 'Slack channel ID for project notifications (e.g., C0123456789)';


