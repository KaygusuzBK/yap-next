-- Görev atama işlemleri için trigger fonksiyonları

-- Görev atandığında task_assignments tablosuna kayıt ekle
create or replace function handle_task_assignment()
returns trigger as $$
begin
  -- Eğer assigned_to değiştiyse
  if old.assigned_to is distinct from new.assigned_to then
    -- Eski atamaları sil
    if old.assigned_to is not null then
      delete from public.task_assignments 
      where task_id = new.id and user_id = old.assigned_to;
    end if;
    
    -- Yeni atama varsa ekle
    if new.assigned_to is not null then
      insert into public.task_assignments (task_id, user_id, assigned_by)
      values (new.id, new.assigned_to, auth.uid());
    end if;
    
    -- Aktivite kaydı ekle
    if new.assigned_to is not null then
      insert into public.task_activities (task_id, user_id, action, details)
      values (
        new.id, 
        auth.uid(), 
        'task_assigned', 
        jsonb_build_object(
          'assigned_to', new.assigned_to,
          'previous_assignee', old.assigned_to
        )
      );
    else
      insert into public.task_activities (task_id, user_id, action, details)
      values (
        new.id, 
        auth.uid(), 
        'task_unassigned', 
        jsonb_build_object(
          'previous_assignee', old.assigned_to
        )
      );
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Görev atama trigger'ı
drop trigger if exists task_assignment_trigger on public.project_tasks;
create trigger task_assignment_trigger
  after update on public.project_tasks
  for each row
  execute function handle_task_assignment();

-- Görev oluşturulduğunda otomatik atama
create or replace function handle_new_task_assignment()
returns trigger as $$
begin
  -- Eğer görev oluşturulurken assigned_to varsa
  if new.assigned_to is not null then
    -- Atama kaydı ekle
    insert into public.task_assignments (task_id, user_id, assigned_by)
    values (new.id, new.assigned_to, new.created_by);
    
    -- Aktivite kaydı ekle
    insert into public.task_activities (task_id, user_id, action, details)
    values (
      new.id, 
      new.created_by, 
      'task_created_with_assignment', 
      jsonb_build_object(
        'assigned_to', new.assigned_to
      )
    );
  else
    -- Sadece görev oluşturma aktivitesi
    insert into public.task_activities (task_id, user_id, action, details)
    values (
      new.id, 
      new.created_by, 
      'task_created', 
      jsonb_build_object(
        'title', new.title,
        'priority', new.priority,
        'status', new.status
      )
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Yeni görev oluşturma trigger'ı
drop trigger if exists new_task_assignment_trigger on public.project_tasks;
create trigger new_task_assignment_trigger
  after insert on public.project_tasks
  for each row
  execute function handle_new_task_assignment();
