// Görev Bağımlılıkları API Fonksiyonları

import { getSupabase } from '@/lib/supabase';
import type { 
  TaskDependency, 
  CreateDependencyRequest, 
  DependencyStats, 
  DependencyChain,
  DependencyType 
} from '../types/dependencies';

// Not: Her çağrıda client alınır; SSR/CSR-context sorunlarını azaltır
function sb() { return getSupabase() }

// Bağımlılık oluştur
export async function createTaskDependency(data: CreateDependencyRequest): Promise<TaskDependency> {
  const { data: dependency, error } = await sb()
    .from('task_dependencies')
    .insert({
      task_id: data.task_id,
      depends_on_task_id: data.depends_on_task_id,
      dependency_type: data.dependency_type,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Bağımlılık oluşturulamadı: ${error.message}`);
  }

  return dependency;
}

// Bağımlılık sil
export async function deleteTaskDependency(dependencyId: string): Promise<void> {
  const { error } = await sb()
    .from('task_dependencies')
    .delete()
    .eq('id', dependencyId);

  if (error) {
    throw new Error(`Bağımlılık silinemedi: ${error.message}`);
  }
}

// Görevin bağımlılıklarını getir
export async function getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
  const { data: dependencies, error } = await sb()
    .from('task_dependencies')
    .select(`
      *,
      depends_on_task:project_tasks!depends_on_task_id (
        id,
        title,
        status,
        priority,
        due_date
      )
    `)
    .eq('task_id', taskId);

  if (error) {
    // Tablo henüz deploy edilmemiş olabilir
    if ((error as any).message?.includes("Could not find the table 'public.task_dependencies'")) {
      return []
    }
    throw new Error(`Bağımlılıklar getirilemedi: ${error.message}`);
  }

  return dependencies || [];
}

// Görevin bağımlı olduğu görevleri getir
export async function getTaskDependents(taskId: string): Promise<TaskDependency[]> {
  const { data: dependents, error } = await sb()
    .from('task_dependencies')
    .select(`
      *,
      task:project_tasks!task_id (
        id,
        title,
        status,
        priority,
        due_date
      )
    `)
    .eq('depends_on_task_id', taskId);

  if (error) {
    if ((error as any).message?.includes("Could not find the table 'public.task_dependencies'")) {
      return []
    }
    throw new Error(`Bağımlı görevler getirilemedi: ${error.message}`);
  }

  return dependents || [];
}

// Bağımlılık istatistiklerini getir
export async function getTaskDependencyStats(taskId: string): Promise<DependencyStats> {
  const { data, error } = await sb()
    .rpc('get_task_dependency_stats', { task_uuid: taskId });

  if (error) {
    if ((error as any).message?.includes('get_task_dependency_stats')) {
      return {
        total_dependencies: 0,
        blocking_dependencies: 0,
        related_dependencies: 0,
        duplicate_dependencies: 0,
        dependency_status: 'no_dependencies',
        blocked_by_tasks: [],
        blocks_tasks: []
      }
    }
    throw new Error(`Bağımlılık istatistikleri getirilemedi: ${error.message}`);
  }

  return data[0] || {
    total_dependencies: 0,
    blocking_dependencies: 0,
    related_dependencies: 0,
    duplicate_dependencies: 0,
    dependency_status: 'no_dependencies',
    blocked_by_tasks: [],
    blocks_tasks: []
  };
}

// Bağımlılık zincirini getir
export async function getDependencyChain(taskId: string, maxDepth: number = 5): Promise<DependencyChain[]> {
  const { data, error } = await sb()
    .rpc('get_dependency_chain', { 
      task_uuid: taskId, 
      max_depth: maxDepth 
    });

  if (error) {
    if ((error as any).message?.includes('get_dependency_chain')) {
      return []
    }
    throw new Error(`Bağımlılık zinciri getirilemedi: ${error.message}`);
  }

  return data || [];
}

// Proje bağımlılık durumlarını getir
export async function getProjectDependencyStatus(projectId: string) {
  const { data, error } = await sb()
    .from('task_dependency_status')
    .select('*')
    .eq('task_id', projectId);

  if (error) {
    if ((error as any).message?.includes("Could not find the table 'public.task_dependency_status'")) {
      return []
    }
    throw new Error(`Proje bağımlılık durumları getirilemedi: ${error.message}`);
  }

  return data || [];
}

// Bağımlılık türüne göre filtrele
export async function getDependenciesByType(
  taskId: string, 
  type: DependencyType
): Promise<TaskDependency[]> {
  const { data, error } = await sb()
    .from('task_dependencies')
    .select(`
      *,
      depends_on_task:project_tasks!depends_on_task_id (
        id,
        title,
        status,
        priority,
        due_date
      )
    `)
    .eq('task_id', taskId)
    .eq('dependency_type', type);

  if (error) {
    throw new Error(`${type} bağımlılıkları getirilemedi: ${error.message}`);
  }

  return data || [];
}

// Engellenen görevleri getir
export async function getBlockedTasks(projectId?: string): Promise<any[]> {
  let query = sb()
    .from('task_dependency_status')
    .select('*')
    .eq('dependency_status', 'blocked');

  if (projectId) {
    query = query.eq('task_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    if ((error as any).message?.includes("Could not find the table 'public.task_dependency_status'")) {
      return []
    }
    throw new Error(`Engellenen görevler getirilemedi: ${error.message}`);
  }

  return data || [];
}

// Hazır görevleri getir (bağımlılıkları tamamlanmış)
export async function getReadyTasks(projectId?: string): Promise<any[]> {
  let query = sb()
    .from('task_dependency_status')
    .select('*')
    .eq('dependency_status', 'ready');

  if (projectId) {
    query = query.eq('task_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    if ((error as any).message?.includes("Could not find the table 'public.task_dependency_status'")) {
      return []
    }
    throw new Error(`Hazır görevler getirilemedi: ${error.message}`);
  }

  return data || [];
}

// Bağımlılık döngüsü kontrolü
export async function checkDependencyCycle(taskId: string, dependsOnTaskId: string): Promise<boolean> {
  try {
    const created = await createTaskDependency({
      task_id: taskId,
      depends_on_task_id: dependsOnTaskId,
      dependency_type: 'blocks'
    });
    
    // Eğer buraya geldiyse döngü yok, oluşturulan bağımlılığı sil
    if ((created as any)?.id) {
      await deleteTaskDependency((created as any).id);
    }
    return false;
  } catch (error) {
    if (error.message.includes('Döngüsel bağımlılık')) {
      return true;
    }
    throw error;
  }
}
