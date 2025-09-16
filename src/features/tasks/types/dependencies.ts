// Görev Bağımlılıkları Tipleri

export type DependencyType = 'blocks' | 'relates_to' | 'duplicates';

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: DependencyType;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface TaskDependencyStatus {
  task_id: string;
  task_title: string;
  task_status: string;
  task_due_date: string | null;
  total_dependencies: number;
  blocking_dependencies: number;
  related_dependencies: number;
  duplicate_dependencies: number;
  dependency_status: 'no_dependencies' | 'blocked' | 'ready' | 'partial';
}

export interface DependencyStats {
  total_dependencies: number;
  blocking_dependencies: number;
  related_dependencies: number;
  duplicate_dependencies: number;
  dependency_status: string;
  blocked_by_tasks: string[];
  blocks_tasks: string[];
}

export interface DependencyChain {
  task_id: string;
  task_title: string;
  task_status: string;
  dependency_type: string;
  depth: number;
  path: string[];
}

export interface CreateDependencyRequest {
  task_id: string;
  depends_on_task_id: string;
  dependency_type: DependencyType;
}

export interface DependencyNode {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  dependencies: DependencyNode[];
  dependents: DependencyNode[];
  level: number;
  position: { x: number; y: number };
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: Array<{
    from: string;
    to: string;
    type: DependencyType;
  }>;
}
