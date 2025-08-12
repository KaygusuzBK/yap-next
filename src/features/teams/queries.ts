"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTeam, deleteTeam, fetchTeams, type Team, updateTeamName } from "./api";

export const teamKeys = {
  all: () => ["teams"] as const,
};

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: teamKeys.all(),
    queryFn: () => fetchTeams(),
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: (created) => {
      qc.setQueryData<Team[]>(teamKeys.all(), (prev) => (prev ? [created, ...prev] : [created]));
    },
  });
}

export function useUpdateTeamName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTeamName,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: teamKeys.all() });
      const prev = qc.getQueryData<Team[]>(teamKeys.all());
      if (prev) qc.setQueryData<Team[]>(teamKeys.all(), prev.map((t) => (t.id === input.team_id ? { ...t, name: input.name } : t)));
      return { prev } as { prev?: Team[] };
    },
    onError: (_err, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData<Team[]>(teamKeys.all(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all() });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTeam,
    onMutate: async (teamId: string) => {
      await qc.cancelQueries({ queryKey: teamKeys.all() });
      const prev = qc.getQueryData<Team[]>(teamKeys.all());
      if (prev) qc.setQueryData<Team[]>(teamKeys.all(), prev.filter((t) => t.id !== teamId));
      return { prev } as { prev?: Team[] };
    },
    onError: (_err, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData<Team[]>(teamKeys.all(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all() });
    },
  });
}


