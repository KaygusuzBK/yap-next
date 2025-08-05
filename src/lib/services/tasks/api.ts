import { db, supabase } from '@/lib/supabase';
import { Task, TaskStats, CreateTaskRequest, UpdateTaskRequest } from '@/lib/types';

export const taskService = {
  // Tüm görevleri getir
  async getAllTasks(): Promise<Task[]> {
    try {
      const tasks = await db.getTasks();
      return tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee_id,
        assignee: task.assignee,
        projectId: task.project_id,
        project: task.project,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        parentTaskId: task.parent_task_id,
        parentTask: task.parent_task,
        tags: task.tags,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Görevi ID ile getir
  async getTaskById(id: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assignee_id,
        assignee: data.assignee,
        projectId: data.project_id,
        project: data.project,
        dueDate: data.due_date,
        estimatedHours: data.estimated_hours,
        actualHours: data.actual_hours,
        parentTaskId: data.parent_task_id,
        parentTask: data.parent_task,
        tags: data.tags,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Yeni görev oluştur
  async createTask(task: CreateTaskRequest): Promise<Task> {
    try {
      const taskData = {
        title: task.title,
        description: task.description,
        status: 'todo',
        priority: task.priority || 'medium',
        assignee_id: task.assigneeId,
        project_id: task.projectId,
        due_date: task.dueDate,
        estimated_hours: task.estimatedHours,
        parent_task_id: task.parentTaskId,
        tags: task.tags || []
      };
      const newTask = await db.createTask(taskData);
      return {
        ...newTask,
        dueDate: newTask.due_date,
        estimatedHours: newTask.estimated_hours,
        actualHours: newTask.actual_hours,
        assigneeId: newTask.assignee_id,
        projectId: newTask.project_id,
        parentTaskId: newTask.parent_task_id,
        createdAt: newTask.created_at,
        updatedAt: newTask.updated_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Görev güncelle
  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task> {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.assigneeId !== undefined) updateData.assignee_id = updates.assigneeId;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.estimatedHours !== undefined) updateData.estimated_hours = updates.estimatedHours;
      if (updates.actualHours !== undefined) updateData.actual_hours = updates.actualHours;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const updatedTask = await db.updateTask(id, updateData);
      
      return {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assigneeId: updatedTask.assignee_id,
        assignee: updatedTask.assignee,
        projectId: updatedTask.project_id,
        project: updatedTask.project,
        dueDate: updatedTask.due_date,
        estimatedHours: updatedTask.estimated_hours,
        actualHours: updatedTask.actual_hours,
        parentTaskId: updatedTask.parent_task_id,
        parentTask: updatedTask.parent_task,
        tags: updatedTask.tags,
        createdAt: updatedTask.created_at,
        updatedAt: updatedTask.updated_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Görev sil
  async deleteTask(id: string): Promise<{ message: string }> {
    try {
      await db.deleteTask(id);
      return { message: 'Görev başarıyla silindi' };
    } catch (error) {
      throw error;
    }
  },

  // Görev istatistikleri
  async getTaskStats(): Promise<TaskStats> {
    try {
      const tasks = await db.getTasks();
      
      const total = tasks.length;
      const todo = tasks.filter((t: any) => t.status === 'todo').length;
      const inProgress = tasks.filter((t: any) => t.status === 'in_progress').length;
      const completed = tasks.filter((t: any) => t.status === 'completed').length;
      const cancelled = tasks.filter((t: any) => t.status === 'cancelled').length;
      
      return {
        total,
        todo,
        inProgress,
        completed,
        cancelled,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    } catch (error) {
      throw error;
    }
  },

  // Proje bazında görevleri getir
  async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee_id,
        assignee: task.assignee,
        projectId: task.project_id,
        project: task.project,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        parentTaskId: task.parent_task_id,
        parentTask: task.parent_task,
        tags: task.tags,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Durum bazında görevleri getir
  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee_id,
        assignee: task.assignee,
        projectId: task.project_id,
        project: task.project,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        parentTaskId: task.parent_task_id,
        parentTask: task.parent_task,
        tags: task.tags,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Atanan kişi bazında görevleri getir
  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', assigneeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee_id,
        assignee: task.assignee,
        projectId: task.project_id,
        project: task.project,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        parentTaskId: task.parent_task_id,
        parentTask: task.parent_task,
        tags: task.tags,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Öncelik bazında görevleri getir
  async getTasksByPriority(priority: Task['priority']): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('priority', priority)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee_id,
        assignee: task.assignee,
        projectId: task.project_id,
        project: task.project,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        parentTaskId: task.parent_task_id,
        parentTask: task.parent_task,
        tags: task.tags,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Geciken görevleri getir
  async getOverdueTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      return data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee_id,
        assignee: task.assignee,
        projectId: task.project_id,
        project: task.project,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        parentTaskId: task.parent_task_id,
        parentTask: task.parent_task,
        tags: task.tags,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Tag bazında görevleri getir
  async getTasksByTag(tag: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .contains('tags', [tag])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee_id,
        assignee: task.assignee,
        projectId: task.project_id,
        project: task.project,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        parentTaskId: task.parent_task_id,
        parentTask: task.parent_task,
        tags: task.tags,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },

  // Görev durumunu güncelle
  async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assignee_id,
        assignee: data.assignee,
        projectId: data.project_id,
        project: data.project,
        dueDate: data.due_date,
        estimatedHours: data.estimated_hours,
        actualHours: data.actual_hours,
        parentTaskId: data.parent_task_id,
        parentTask: data.parent_task,
        tags: data.tags,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Görev önceliğini güncelle
  async updateTaskPriority(id: string, priority: Task['priority']): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ priority })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assignee_id,
        assignee: data.assignee,
        projectId: data.project_id,
        project: data.project,
        dueDate: data.due_date,
        estimatedHours: data.estimated_hours,
        actualHours: data.actual_hours,
        parentTaskId: data.parent_task_id,
        parentTask: data.parent_task,
        tags: data.tags,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Görev atamasını güncelle
  async assignTask(id: string, assigneeId: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ assignee_id: assigneeId })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assignee_id,
        assignee: data.assignee,
        projectId: data.project_id,
        project: data.project,
        dueDate: data.due_date,
        estimatedHours: data.estimated_hours,
        actualHours: data.actual_hours,
        parentTaskId: data.parent_task_id,
        parentTask: data.parent_task,
        tags: data.tags,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Görev saatlerini güncelle
  async updateTaskHours(id: string, actualHours: number): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ actual_hours: actualHours })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assignee_id,
        assignee: data.assignee,
        projectId: data.project_id,
        project: data.project,
        dueDate: data.due_date,
        estimatedHours: data.estimated_hours,
        actualHours: data.actual_hours,
        parentTaskId: data.parent_task_id,
        parentTask: data.parent_task,
        tags: data.tags,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      throw error;
    }
  },

  // Alt görevleri getir
  async getSubTasks(parentTaskId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_task_id', parentTaskId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee_id,
        assignee: task.assignee,
        projectId: task.project_id,
        project: task.project,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        parentTaskId: task.parent_task_id,
        parentTask: task.parent_task,
        tags: task.tags,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));
    } catch (error) {
      throw error;
    }
  },
};