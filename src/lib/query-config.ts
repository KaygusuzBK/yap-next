"use client"

import { QueryClient } from "@tanstack/react-query"

// Gelişmiş React Query konfigürasyonu
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Veri ne kadar süre fresh kalacak (5 dakika)
        staleTime: 5 * 60_000,
        // Cache ne kadar süre saklanacak (10 dakika)
        gcTime: 10 * 60_000,
        // Pencere odaklandığında yeniden fetch et
        refetchOnWindowFocus: true,
        // Arka planda yeniden fetch et
        refetchOnMount: true,
        // Bağlantı yeniden kurulduğunda fetch et
        refetchOnReconnect: true,
        // Retry sayısı
        retry: (failureCount, error) => {
          // 4xx hatalarında retry etme
          if (error instanceof Error && 'status' in error) {
            const status = (error as any).status
            if (status >= 400 && status < 500) {
              return false
            }
          }
          // Diğer durumlarda maksimum 3 kez retry et
          return failureCount < 3
        },
        // Retry delay (exponential backoff)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Network error'da retry et
        retryOnMount: true,
        // Structural sharing (performans için)
        structuralSharing: true,
      },
      mutations: {
        // Mutation'larda retry etme
        retry: 0,
      },
    },
  })
}

// Query key factory'leri
export const queryKeys = {
  // Tasks
  tasks: {
    all: () => ['tasks'] as const,
    lists: () => ['tasks', 'list'] as const,
    list: (filters: Record<string, any>) => ['tasks', 'list', filters] as const,
    details: () => ['tasks', 'detail'] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
    comments: (taskId: string) => ['tasks', 'detail', taskId, 'comments'] as const,
    files: (taskId: string) => ['tasks', 'detail', taskId, 'files'] as const,
  },
  
  // Projects
  projects: {
    all: () => ['projects'] as const,
    lists: () => ['projects', 'list'] as const,
    list: (filters: Record<string, any>) => ['projects', 'list', filters] as const,
    details: () => ['projects', 'detail'] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    members: (projectId: string) => ['projects', 'detail', projectId, 'members'] as const,
    statuses: (projectId: string) => ['projects', 'detail', projectId, 'statuses'] as const,
  },
  
  // Teams
  teams: {
    all: () => ['teams'] as const,
    lists: () => ['teams', 'list'] as const,
    list: (filters: Record<string, any>) => ['teams', 'list', filters] as const,
    details: () => ['teams', 'detail'] as const,
    detail: (id: string) => ['teams', 'detail', id] as const,
    members: (teamId: string) => ['teams', 'detail', teamId, 'members'] as const,
    invitations: () => ['teams', 'invitations'] as const,
  },
  
  // User
  user: {
    all: () => ['user'] as const,
    profile: () => ['user', 'profile'] as const,
    preferences: () => ['user', 'preferences'] as const,
  },
  
  // Dashboard
  dashboard: {
    all: () => ['dashboard'] as const,
    stats: () => ['dashboard', 'stats'] as const,
    activities: () => ['dashboard', 'activities'] as const,
    performance: (range: string) => ['dashboard', 'performance', range] as const,
  },
} as const

// Cache invalidation helpers
export const cacheInvalidation = {
  // Tüm task'ları invalidate et
  invalidateAllTasks: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() })
  },
  
  // Belirli bir task'ı invalidate et
  invalidateTask: (queryClient: QueryClient, taskId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) })
  },
  
  // Tüm projeleri invalidate et
  invalidateAllProjects: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() })
  },
  
  // Belirli bir projeyi invalidate et
  invalidateProject: (queryClient: QueryClient, projectId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
  },
  
  // Tüm takımları invalidate et
  invalidateAllTeams: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() })
  },
  
  // Dashboard'u invalidate et
  invalidateDashboard: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
  },
} as const

// Prefetch helpers
export const prefetchHelpers = {
  // Task detayını prefetch et
  prefetchTask: async (queryClient: QueryClient, taskId: string, queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.detail(taskId),
      queryFn,
      staleTime: 5 * 60_000,
    })
  },
  
  // Proje detayını prefetch et
  prefetchProject: async (queryClient: QueryClient, projectId: string, queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(projectId),
      queryFn,
      staleTime: 5 * 60_000,
    })
  },
  
  // Takım detayını prefetch et
  prefetchTeam: async (queryClient: QueryClient, teamId: string, queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.teams.detail(teamId),
      queryFn,
      staleTime: 5 * 60_000,
    })
  },
} as const
