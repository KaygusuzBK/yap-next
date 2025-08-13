"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addComment,
  createTask,
  deleteComment,
  deleteTask,
  fetchComments,
  fetchMyTasks,
  fetchProjectStatuses,
  fetchStatusesForProjects,
  fetchTaskById,
  listTaskFiles,
  type ProjectTaskStatus,
  type Task,
  type TaskComment,
  type TaskFile,
  updateTask,
} from "./api";
import { getSupabase } from "@/lib/supabase";

export const keys = {
  tasks: () => ["tasks"] as const,
  task: (id: string) => ["task", id] as const,
  comments: (taskId: string) => ["task", taskId, "comments"] as const,
  files: (taskId: string) => ["task", taskId, "files"] as const,
  projectStatuses: (projectId: string) => ["project-statuses", projectId] as const,
  statusesForProjects: (ids: string[]) => ["statuses-for-projects", ...ids.sort()] as const,
};

export function useMyTasks() {
  return useQuery({
    queryKey: keys.tasks(),
    queryFn: () => fetchMyTasks(),
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: keys.task(taskId),
    queryFn: () => fetchTaskById(taskId),
    enabled: Boolean(taskId),
  });
}

export function useComments(taskId: string) {
  return useQuery<TaskComment[]>({
    queryKey: keys.comments(taskId),
    queryFn: () => fetchComments(taskId),
    enabled: Boolean(taskId),
  });
}

export function useProjectStatuses(projectId: string) {
  return useQuery<ProjectTaskStatus[]>({
    queryKey: keys.projectStatuses(projectId),
    queryFn: () => fetchProjectStatuses(projectId),
    enabled: Boolean(projectId),
    staleTime: 5 * 60_000,
  });
}

export function useStatusesForProjects(projectIds: string[]) {
  return useQuery<Record<string, ProjectTaskStatus[]>>({
    queryKey: keys.statusesForProjects(projectIds),
    queryFn: () => fetchStatusesForProjects(projectIds),
    enabled: projectIds.length > 0,
    staleTime: 5 * 60_000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: (created) => {
      // Merge to tasks cache optimistically
      qc.setQueryData<Task[]>(keys.tasks(), (prev) => (prev ? [created, ...prev] : [created]));
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTask,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: keys.tasks() });
      const prev = qc.getQueryData<Task[]>(keys.tasks());
      if (prev) {
        qc.setQueryData<Task[]>(keys.tasks(), prev.map((t) => (t.id === input.id ? { ...t, ...input } as Task : t)));
      }
      return { prev } as { prev?: Task[] };
    },
    onError: (_err, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData<Task[]>(keys.tasks(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.tasks() });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId: string) => {
      await qc.cancelQueries({ queryKey: keys.tasks() });
      const prev = qc.getQueryData<Task[]>(keys.tasks());
      if (prev) qc.setQueryData<Task[]>(keys.tasks(), prev.filter((t) => t.id !== taskId));
      return { prev } as { prev?: Task[] };
    },
    onError: (_err, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData<Task[]>(keys.tasks(), ctx.prev);
    },
  });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => addComment(taskId, content),
    onMutate: async (content: string) => {
      await qc.cancelQueries({ queryKey: keys.comments(taskId) });
      const prev = qc.getQueryData<TaskComment[]>(keys.comments(taskId));
      const optimistic: TaskComment = {
        id: `tmp-${Date.now()}`,
        task_id: taskId,
        created_by: "me",
        content,
        created_at: new Date().toISOString(),
        author_name: null,
        author_email: null,
      };
      qc.setQueryData<TaskComment[]>(keys.comments(taskId), [...(prev ?? []), optimistic]);
      return { prev } as { prev?: TaskComment[] };
    },
    onError: (_err, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData<TaskComment[]>(keys.comments(taskId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.comments(taskId) });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onMutate: async (commentId: string) => {
      await qc.cancelQueries({ queryKey: keys.comments(taskId) });
      const prev = qc.getQueryData<TaskComment[]>(keys.comments(taskId));
      if (prev) qc.setQueryData<TaskComment[]>(keys.comments(taskId), prev.filter((c) => c.id !== commentId));
      return { prev } as { prev?: TaskComment[] };
    },
    onError: (_err, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData<TaskComment[]>(keys.comments(taskId), ctx.prev);
    },
  });
}

export function useTaskFiles(taskId: string) {
  return useQuery<TaskFile[]>({
    queryKey: keys.files(taskId),
    queryFn: () => listTaskFiles(taskId),
    enabled: Boolean(taskId),
  });
}

export type TaskStatusInterval = {
  task_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  seconds_in_status: number;
}

export function useTaskStatusTimeline(taskId: string) {
  return useQuery<TaskStatusInterval[]>({
    queryKey: ["task", taskId, "status-timeline"],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('task_status_intervals')
        .select('*')
        .eq('task_id', taskId)
        .order('started_at', { ascending: true })
      if (error) throw error
      return (data as TaskStatusInterval[]) || []
    },
    enabled: Boolean(taskId),
    staleTime: 60_000,
  })
}


