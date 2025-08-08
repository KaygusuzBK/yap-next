-- Görev tabloları için performans indeksleri

-- project_tasks tablosu indeksleri
create index if not exists idx_project_tasks_project_id on public.project_tasks(project_id);
create index if not exists idx_project_tasks_assigned_to on public.project_tasks(assigned_to);
create index if not exists idx_project_tasks_created_by on public.project_tasks(created_by);
create index if not exists idx_project_tasks_status on public.project_tasks(status);
create index if not exists idx_project_tasks_priority on public.project_tasks(priority);
create index if not exists idx_project_tasks_due_date on public.project_tasks(due_date);
create index if not exists idx_project_tasks_created_at on public.project_tasks(created_at);
create index if not exists idx_project_tasks_updated_at on public.project_tasks(updated_at);

-- Composite indeksler
create index if not exists idx_project_tasks_project_status on public.project_tasks(project_id, status);
create index if not exists idx_project_tasks_project_priority on public.project_tasks(project_id, priority);
create index if not exists idx_project_tasks_assigned_status on public.project_tasks(assigned_to, status);
create index if not exists idx_project_tasks_due_date_status on public.project_tasks(due_date, status);

-- task_assignments tablosu indeksleri
create index if not exists idx_task_assignments_task_id on public.task_assignments(task_id);
create index if not exists idx_task_assignments_user_id on public.task_assignments(user_id);
create index if not exists idx_task_assignments_assigned_by on public.task_assignments(assigned_by);
create index if not exists idx_task_assignments_assigned_at on public.task_assignments(assigned_at);

-- task_comments tablosu indeksleri
create index if not exists idx_task_comments_task_id on public.task_comments(task_id);
create index if not exists idx_task_comments_created_by on public.task_comments(created_by);
create index if not exists idx_task_comments_created_at on public.task_comments(created_at);

-- task_time_logs tablosu indeksleri
create index if not exists idx_task_time_logs_task_id on public.task_time_logs(task_id);
create index if not exists idx_task_time_logs_user_id on public.task_time_logs(user_id);
create index if not exists idx_task_time_logs_start_time on public.task_time_logs(start_time);
create index if not exists idx_task_time_logs_end_time on public.task_time_logs(end_time);

-- task_tag_relations tablosu indeksleri
create index if not exists idx_task_tag_relations_task_id on public.task_tag_relations(task_id);
create index if not exists idx_task_tag_relations_tag_id on public.task_tag_relations(tag_id);

-- task_files tablosu indeksleri
create index if not exists idx_task_files_task_id on public.task_files(task_id);
create index if not exists idx_task_files_uploaded_by on public.task_files(uploaded_by);
create index if not exists idx_task_files_created_at on public.task_files(created_at);

-- task_activities tablosu indeksleri
create index if not exists idx_task_activities_task_id on public.task_activities(task_id);
create index if not exists idx_task_activities_user_id on public.task_activities(user_id);
create index if not exists idx_task_activities_action on public.task_activities(action);
create index if not exists idx_task_activities_created_at on public.task_activities(created_at);

-- Full-text search indeksleri
create index if not exists idx_project_tasks_title_fts on public.project_tasks using gin(to_tsvector('turkish', title));
create index if not exists idx_project_tasks_description_fts on public.project_tasks using gin(to_tsvector('turkish', description));
create index if not exists idx_task_comments_content_fts on public.task_comments using gin(to_tsvector('turkish', content));
