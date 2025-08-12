"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, deleteProject, fetchProjects, type Project, updateProject } from "./api";

export const projectKeys = {
  all: () => ["projects"] as const,
};

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: projectKeys.all(),
    queryFn: () => fetchProjects(),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: (created) => {
      qc.setQueryData<Project[]>(projectKeys.all(), (prev) => (prev ? [created, ...prev] : [created]));
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: projectKeys.all() });
      const prev = qc.getQueryData<Project[]>(projectKeys.all());
      if (prev) qc.setQueryData<Project[]>(projectKeys.all(), prev.map((p) => (p.id === input.id ? { ...p, ...input } as Project : p)));
      return { prev } as { prev?: Project[] };
    },
    onError: (_err, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData<Project[]>(projectKeys.all(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all() });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onMutate: async (projectId: string) => {
      await qc.cancelQueries({ queryKey: projectKeys.all() });
      const prev = qc.getQueryData<Project[]>(projectKeys.all());
      if (prev) qc.setQueryData<Project[]>(projectKeys.all(), prev.filter((p) => p.id !== projectId));
      return { prev } as { prev?: Project[] };
    },
    onError: (_err, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData<Project[]>(projectKeys.all(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all() });
    },
  });
}


