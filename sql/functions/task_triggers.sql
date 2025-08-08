-- Görev tabloları için trigger fonksiyonları

-- Görev oluşturulduğunda aktivite kaydı oluştur
create or replace function public.handle_new_task()
returns trigger as $$
begin
  insert into public.task_activities (task_id, user_id, action, details)
  values (
    new.id, 
    new.created_by, 
    'task_created',
    jsonb_build_object(
      'title', new.title,
      'status', new.status,
      'priority', new.priority
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Görev güncellendiğinde aktivite kaydı oluştur
create or replace function public.handle_task_update()
returns trigger as $$
declare
  changes jsonb := '{}';
begin
  -- Değişiklikleri tespit et
  if old.title != new.title then
    changes := changes || jsonb_build_object('title', jsonb_build_object('old', old.title, 'new', new.title));
  end if;
  
  if old.description is distinct from new.description then
    changes := changes || jsonb_build_object('description', jsonb_build_object('old', old.description, 'new', new.description));
  end if;
  
  if old.status != new.status then
    changes := changes || jsonb_build_object('status', jsonb_build_object('old', old.status, 'new', new.status));
  end if;
  
  if old.priority != new.priority then
    changes := changes || jsonb_build_object('priority', jsonb_build_object('old', old.priority, 'new', new.priority));
  end if;
  
  if old.assigned_to is distinct from new.assigned_to then
    changes := changes || jsonb_build_object('assigned_to', jsonb_build_object('old', old.assigned_to, 'new', new.assigned_to));
  end if;
  
  if old.due_date is distinct from new.due_date then
    changes := changes || jsonb_build_object('due_date', jsonb_build_object('old', old.due_date, 'new', new.due_date));
  end if;
  
  -- Eğer değişiklik varsa aktivite kaydı oluştur
  if changes != '{}' then
    insert into public.task_activities (task_id, user_id, action, details)
    values (
      new.id, 
      auth.uid(), 
      'task_updated',
      changes
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Görev silindiğinde aktivite kaydı oluştur
create or replace function public.handle_task_delete()
returns trigger as $$
begin
  insert into public.task_activities (task_id, user_id, action, details)
  values (
    old.id, 
    auth.uid(), 
    'task_deleted',
    jsonb_build_object(
      'title', old.title,
      'status', old.status,
      'priority', old.priority
    )
  );
  return old;
end;
$$ language plpgsql security definer;

-- Görev yorumu oluşturulduğunda aktivite kaydı oluştur
create or replace function public.handle_new_task_comment()
returns trigger as $$
begin
  insert into public.task_activities (task_id, user_id, action, details)
  values (
    new.task_id, 
    new.created_by, 
    'comment_added',
    jsonb_build_object(
      'comment_id', new.id,
      'content_preview', left(new.content, 100)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Görev ataması oluşturulduğunda aktivite kaydı oluştur
create or replace function public.handle_new_task_assignment()
returns trigger as $$
begin
  insert into public.task_activities (task_id, user_id, action, details)
  values (
    new.task_id, 
    new.assigned_by, 
    'task_assigned',
    jsonb_build_object(
      'assigned_to', new.user_id,
      'assigned_by', new.assigned_by
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Görev ataması silindiğinde aktivite kaydı oluştur
create or replace function public.handle_task_assignment_delete()
returns trigger as $$
begin
  insert into public.task_activities (task_id, user_id, action, details)
  values (
    old.task_id, 
    auth.uid(), 
    'task_unassigned',
    jsonb_build_object(
      'unassigned_from', old.user_id
    )
  );
  return old;
end;
$$ language plpgsql security definer;

-- Görev dosyası yüklendiğinde aktivite kaydı oluştur
create or replace function public.handle_new_task_file()
returns trigger as $$
begin
  insert into public.task_activities (task_id, user_id, action, details)
  values (
    new.task_id, 
    new.uploaded_by, 
    'file_uploaded',
    jsonb_build_object(
      'file_name', new.file_name,
      'file_size', new.file_size,
      'file_type', new.file_type
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Görev dosyası silindiğinde aktivite kaydı oluştur
create or replace function public.handle_task_file_delete()
returns trigger as $$
begin
  insert into public.task_activities (task_id, user_id, action, details)
  values (
    old.task_id, 
    auth.uid(), 
    'file_deleted',
    jsonb_build_object(
      'file_name', old.file_name
    )
  );
  return old;
end;
$$ language plpgsql security definer;
