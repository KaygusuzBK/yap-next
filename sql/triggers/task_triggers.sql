-- Görev tabloları için trigger'lar

-- project_tasks tablosu trigger'ları
do $$ begin
  -- Görev oluşturulduğunda aktivite kaydı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_new_task_trigger' and tgrelid = 'public.project_tasks'::regclass
  ) then
    create trigger handle_new_task_trigger
      after insert on public.project_tasks
      for each row
      execute function public.handle_new_task();
  end if;

  -- Görev güncellendiğinde aktivite kaydı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_task_update_trigger' and tgrelid = 'public.project_tasks'::regclass
  ) then
    create trigger handle_task_update_trigger
      after update on public.project_tasks
      for each row
      execute function public.handle_task_update();
  end if;

  -- Görev silindiğinde aktivite kaydı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_task_delete_trigger' and tgrelid = 'public.project_tasks'::regclass
  ) then
    create trigger handle_task_delete_trigger
      before delete on public.project_tasks
      for each row
      execute function public.handle_task_delete();
  end if;

  -- Görev updated_at trigger'ı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_project_tasks_updated_at' and tgrelid = 'public.project_tasks'::regclass
  ) then
    create trigger handle_project_tasks_updated_at
      before update on public.project_tasks
      for each row
      execute function public.handle_updated_at();
  end if;
end $$;

-- task_comments tablosu trigger'ları
do $$ begin
  -- Yorum oluşturulduğunda aktivite kaydı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_new_task_comment_trigger' and tgrelid = 'public.task_comments'::regclass
  ) then
    create trigger handle_new_task_comment_trigger
      after insert on public.task_comments
      for each row
      execute function public.handle_new_task_comment();
  end if;

  -- Yorum updated_at trigger'ı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_task_comments_updated_at' and tgrelid = 'public.task_comments'::regclass
  ) then
    create trigger handle_task_comments_updated_at
      before update on public.task_comments
      for each row
      execute function public.handle_updated_at();
  end if;
end $$;

-- task_assignments tablosu trigger'ları
do $$ begin
  -- Atama oluşturulduğunda aktivite kaydı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_new_task_assignment_trigger' and tgrelid = 'public.task_assignments'::regclass
  ) then
    create trigger handle_new_task_assignment_trigger
      after insert on public.task_assignments
      for each row
      execute function public.handle_new_task_assignment();
  end if;

  -- Atama silindiğinde aktivite kaydı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_task_assignment_delete_trigger' and tgrelid = 'public.task_assignments'::regclass
  ) then
    create trigger handle_task_assignment_delete_trigger
      before delete on public.task_assignments
      for each row
      execute function public.handle_task_assignment_delete();
  end if;
end $$;

-- task_files tablosu trigger'ları
do $$ begin
  -- Dosya yüklendiğinde aktivite kaydı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_new_task_file_trigger' and tgrelid = 'public.task_files'::regclass
  ) then
    create trigger handle_new_task_file_trigger
      after insert on public.task_files
      for each row
      execute function public.handle_new_task_file();
  end if;

  -- Dosya silindiğinde aktivite kaydı
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_task_file_delete_trigger' and tgrelid = 'public.task_files'::regclass
  ) then
    create trigger handle_task_file_delete_trigger
      before delete on public.task_files
      for each row
      execute function public.handle_task_file_delete();
  end if;
end $$;
