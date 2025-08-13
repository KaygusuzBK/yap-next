-- Task status history and durations per stage
-- Safe views built on top of existing project_tasks and task_activities

-- 1) Transitions: includes the initial creation as the first status
create or replace view public.task_status_transitions as
with initial as (
  select
    t.id as task_id,
    null::text as from_status,
    t.status::text as to_status,
    t.created_at as changed_at,
    t.created_by as changed_by
  from public.project_tasks t
), updates as (
  select
    ta.task_id,
    (ta.details -> 'status' ->> 'old')::text as from_status,
    (ta.details -> 'status' ->> 'new')::text as to_status,
    ta.created_at as changed_at,
    ta.user_id as changed_by
  from public.task_activities ta
  where ta.action = 'task_updated'
    and (ta.details ? 'status')
)
select * from initial
union all
select * from updates;

-- 2) Intervals per status: start/end and duration in seconds
create or replace view public.task_status_intervals as
select
  task_id,
  to_status as status,
  changed_at as started_at,
  lead(changed_at) over (partition by task_id order by changed_at) as ended_at,
  extract(epoch from coalesce(lead(changed_at) over (partition by task_id order by changed_at), now()) - changed_at)::bigint as seconds_in_status
from public.task_status_transitions
where to_status is not null;

-- 3) Aggregated durations per task and status
create or replace view public.task_status_durations as
select
  i.task_id,
  i.status,
  sum(i.seconds_in_status)::bigint as total_seconds_in_status
from public.task_status_intervals i
group by i.task_id, i.status;

-- 4) Convenience view: task timeline with project/title
create or replace view public.task_status_timeline as
select
  t.id as task_id,
  t.title,
  p.id as project_id,
  p.title as project_title,
  i.status,
  i.started_at,
  i.ended_at,
  i.seconds_in_status
from public.project_tasks t
join public.projects p on p.id = t.project_id
join public.task_status_intervals i on i.task_id = t.id
order by t.id, i.started_at;


