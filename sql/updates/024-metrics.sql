-- Metrics views: average time in status, cycle time, SLA (review > 2 days)

-- 1) Average seconds spent in each status per project
create or replace view public.project_status_avg_seconds as
select
  p.id as project_id,
  p.title as project_title,
  i.status,
  avg(i.seconds_in_status)::bigint as avg_seconds,
  count(*)::bigint as sample_count
from public.task_status_intervals i
join public.project_tasks t on t.id = i.task_id
join public.projects p on p.id = t.project_id
group by p.id, p.title, i.status;

-- 2) Cycle time per task (first in_progress -> first completed)
create or replace view public.task_cycle_time as
with firsts as (
  select
    task_id,
    min(changed_at) filter (where to_status = 'in_progress') as first_in_progress,
    min(changed_at) filter (where to_status = 'completed')   as first_completed
  from public.task_status_transitions
  group by task_id
)
select
  t.id as task_id,
  t.title,
  p.id as project_id,
  p.title as project_title,
  f.first_in_progress,
  f.first_completed,
  case when f.first_in_progress is not null and f.first_completed is not null and f.first_completed > f.first_in_progress
       then extract(epoch from (f.first_completed - f.first_in_progress))::bigint
       else null end as cycle_seconds
from public.project_tasks t
join firsts f on f.task_id = t.id
join public.projects p on p.id = t.project_id;

-- 3) Average cycle time per project (completed tasks only)
create or replace view public.project_cycle_time_avg as
select
  project_id,
  project_title,
  avg(cycle_seconds)::bigint as avg_cycle_seconds,
  count(*) filter (where cycle_seconds is not null)::bigint as completed_count
from public.task_cycle_time
where cycle_seconds is not null
group by project_id, project_title;

-- 4) SLA: tasks stuck in review more than 2 days (configurable threshold via where)
create or replace view public.review_sla_breaches as
with last_review as (
  select
    t.id as task_id,
    max(changed_at) filter (where to_status = 'review') as last_review_at
  from public.project_tasks t
  left join public.task_status_transitions tr on tr.task_id = t.id
  group by t.id
)
select
  t.id as task_id,
  t.title,
  p.id as project_id,
  p.title as project_title,
  t.assigned_to,
  pr.full_name,
  pr.email,
  lr.last_review_at,
  extract(epoch from (now() - lr.last_review_at))::bigint as seconds_in_review
from public.project_tasks t
join public.projects p on p.id = t.project_id
join last_review lr on lr.task_id = t.id
left join public.profiles pr on pr.id = t.assigned_to
where t.status = 'review' and lr.last_review_at is not null and now() - lr.last_review_at > interval '2 days';


