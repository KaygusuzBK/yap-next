-- Görev tabloları için RLS politikaları

-- RLS'yi etkinleştir
alter table public.project_tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_time_logs enable row level security;
alter table public.task_files enable row level security;
alter table public.task_activities enable row level security;

-- project_tasks tablosu için politikalar
do $$ begin
  -- Görevleri okuyabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'read_project_tasks'
  ) then
    create policy "read_project_tasks" on public.project_tasks
      for select using (
        project_id in (
          select id from public.projects 
          where owner_id = auth.uid() or 
                id in (select project_id from public.project_members where user_id = auth.uid())
        )
      );
  end if;

  -- Görev oluşturabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'create_project_tasks'
  ) then
    create policy "create_project_tasks" on public.project_tasks
      for insert with check (
        project_id in (
          select id from public.projects 
          where owner_id = auth.uid() or 
                id in (select project_id from public.project_members where user_id = auth.uid())
        ) and
        created_by = auth.uid()
      );
  end if;

  -- Görev güncelleyebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'update_project_tasks'
  ) then
    create policy "update_project_tasks" on public.project_tasks
      for update using (
        project_id in (
          select id from public.projects 
          where owner_id = auth.uid() or 
                id in (select project_id from public.project_members where user_id = auth.uid())
        )
      );
  end if;

  -- Görev silebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'project_tasks' and policyname = 'delete_project_tasks'
  ) then
    create policy "delete_project_tasks" on public.project_tasks
      for delete using (
        project_id in (
          select id from public.projects 
          where owner_id = auth.uid()
        ) or
        created_by = auth.uid()
      );
  end if;
end $$;

-- task_assignments tablosu için politikalar
do $$ begin
  -- Atama okuyabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_assignments' and policyname = 'read_task_assignments'
  ) then
    create policy "read_task_assignments" on public.task_assignments
      for select using (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid())
          )
        )
      );
  end if;

  -- Atama oluşturabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_assignments' and policyname = 'create_task_assignments'
  ) then
    create policy "create_task_assignments" on public.task_assignments
      for insert with check (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid() and role in ('owner', 'admin'))
          )
        ) and
        assigned_by = auth.uid()
      );
  end if;

  -- Atama güncelleyebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_assignments' and policyname = 'update_task_assignments'
  ) then
    create policy "update_task_assignments" on public.task_assignments
      for update using (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid() and role in ('owner', 'admin'))
          )
        )
      );
  end if;

  -- Atama silebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_assignments' and policyname = 'delete_task_assignments'
  ) then
    create policy "delete_task_assignments" on public.task_assignments
      for delete using (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid() and role in ('owner', 'admin'))
          )
        ) or
        assigned_by = auth.uid()
      );
  end if;
end $$;

-- task_comments tablosu için politikalar
do $$ begin
  -- Yorum okuyabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_comments' and policyname = 'read_task_comments'
  ) then
    create policy "read_task_comments" on public.task_comments
      for select using (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid())
          )
        )
      );
  end if;

  -- Yorum oluşturabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_comments' and policyname = 'create_task_comments'
  ) then
    create policy "create_task_comments" on public.task_comments
      for insert with check (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid())
          )
        ) and
        created_by = auth.uid()
      );
  end if;

  -- Yorum güncelleyebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_comments' and policyname = 'update_task_comments'
  ) then
    create policy "update_task_comments" on public.task_comments
      for update using (created_by = auth.uid());
  end if;

  -- Yorum silebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_comments' and policyname = 'delete_task_comments'
  ) then
    create policy "delete_task_comments" on public.task_comments
      for delete using (
        created_by = auth.uid() or
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid()
          )
        )
      );
  end if;
end $$;

-- task_time_logs tablosu için politikalar
do $$ begin
  -- Zaman kaydı okuyabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_time_logs' and policyname = 'read_task_time_logs'
  ) then
    create policy "read_task_time_logs" on public.task_time_logs
      for select using (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid())
          )
        )
      );
  end if;

  -- Zaman kaydı oluşturabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_time_logs' and policyname = 'create_task_time_logs'
  ) then
    create policy "create_task_time_logs" on public.task_time_logs
      for insert with check (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid())
          )
        ) and
        user_id = auth.uid()
      );
  end if;

  -- Zaman kaydı güncelleyebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_time_logs' and policyname = 'update_task_time_logs'
  ) then
    create policy "update_task_time_logs" on public.task_time_logs
      for update using (user_id = auth.uid());
  end if;

  -- Zaman kaydı silebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_time_logs' and policyname = 'delete_task_time_logs'
  ) then
    create policy "delete_task_time_logs" on public.task_time_logs
      for delete using (user_id = auth.uid());
  end if;
end $$;

-- task_files tablosu için politikalar
do $$ begin
  -- Dosya okuyabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_files' and policyname = 'read_task_files'
  ) then
    create policy "read_task_files" on public.task_files
      for select using (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid())
          )
        )
      );
  end if;

  -- Dosya yükleyebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_files' and policyname = 'create_task_files'
  ) then
    create policy "create_task_files" on public.task_files
      for insert with check (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid())
          )
        ) and
        uploaded_by = auth.uid()
      );
  end if;

  -- Dosya silebilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_files' and policyname = 'delete_task_files'
  ) then
    create policy "delete_task_files" on public.task_files
      for delete using (
        uploaded_by = auth.uid() or
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid()
          )
        )
      );
  end if;
end $$;

-- task_activities tablosu için politikalar (sadece okuma)
do $$ begin
  -- Aktivite okuyabilme politikası
  if not exists (
    select 1 from pg_policies 
    where tablename = 'task_activities' and policyname = 'read_task_activities'
  ) then
    create policy "read_task_activities" on public.task_activities
      for select using (
        task_id in (
          select id from public.project_tasks 
          where project_id in (
            select id from public.projects 
            where owner_id = auth.uid() or 
                  id in (select project_id from public.project_members where user_id = auth.uid())
          )
        )
      );
  end if;
end $$;
