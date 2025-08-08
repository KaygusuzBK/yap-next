-- Görev güncelleme işlemleri için trigger fonksiyonları

-- Görev güncellendiğinde aktivite kaydı ekle
create or replace function handle_task_update()
returns trigger as $$
declare
  changes jsonb := '{}'::jsonb;
begin
  -- Değişiklikleri tespit et
  if old.title is distinct from new.title then
    changes := changes || jsonb_build_object('title', jsonb_build_object('old', old.title, 'new', new.title));
  end if;
  
  if old.description is distinct from new.description then
    changes := changes || jsonb_build_object('description', jsonb_build_object('old', old.description, 'new', new.description));
  end if;
  
  if old.status is distinct from new.status then
    changes := changes || jsonb_build_object('status', jsonb_build_object('old', old.status, 'new', new.status));
  end if;
  
  if old.priority is distinct from new.priority then
    changes := changes || jsonb_build_object('priority', jsonb_build_object('old', old.priority, 'new', new.priority));
  end if;
  
  if old.due_date is distinct from new.due_date then
    changes := changes || jsonb_build_object('due_date', jsonb_build_object('old', old.due_date, 'new', new.due_date));
  end if;
  
  -- Eğer değişiklik varsa aktivite kaydı ekle
  if changes != '{}'::jsonb then
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

-- Görev güncelleme trigger'ı
drop trigger if exists task_update_trigger on public.project_tasks;
create trigger task_update_trigger
  after update on public.project_tasks
  for each row
  execute function handle_task_update();

-- Görev silindiğinde aktivite kaydı ekle
create or replace function handle_task_delete()
returns trigger as $$
begin
  -- Silme aktivitesi kaydı ekle
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

-- Görev silme trigger'ı
drop trigger if exists task_delete_trigger on public.project_tasks;
create trigger task_delete_trigger
  before delete on public.project_tasks
  for each row
  execute function handle_task_delete();
