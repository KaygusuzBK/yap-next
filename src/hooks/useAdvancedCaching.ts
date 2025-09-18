"use client"

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { queryKeys, cacheInvalidation } from '@/lib/query-config'

// Optimistic updates için hook
interface UseOptimisticUpdateOptions<T> {
  queryKey: string[]
  updateFn: (oldData: T, newData: Partial<T>) => T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useOptimisticUpdate<T>({
  queryKey,
  updateFn,
  onSuccess,
  onError
}: UseOptimisticUpdateOptions<T>) {
  const queryClient = useQueryClient()

  const updateData = useCallback((newData: Partial<T>) => {
    queryClient.setQueryData<T>(queryKey, (oldData) => {
      if (!oldData) return oldData
      return updateFn(oldData, newData)
    })
  }, [queryClient, queryKey, updateFn])

  const revertData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  return {
    updateData,
    revertData
  }
}

// Background refetch için hook
interface UseBackgroundRefetchOptions {
  queryKey: string[]
  refetchInterval?: number
  enabled?: boolean
}

export function useBackgroundRefetch({
  queryKey,
  refetchInterval = 30000, // 30 saniye
  enabled = true
}: UseBackgroundRefetchOptions) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey })
    }, refetchInterval)

    return () => clearInterval(interval)
  }, [queryClient, queryKey, refetchInterval, enabled])
}

// Cache warming için hook
export function useCacheWarming() {
  const queryClient = useQueryClient()

  const warmCache = useCallback(async (queries: Array<{
    queryKey: readonly string[]
    queryFn: () => Promise<any>
    staleTime?: number
  }>) => {
    const promises = queries.map(({ queryKey, queryFn, staleTime = 5 * 60_000 }) =>
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime
      })
    )

    await Promise.all(promises)
  }, [queryClient])

  const warmUserData = useCallback(async () => {
    // Kullanıcı verilerini önceden yükle
    await warmCache([
      {
        queryKey: queryKeys.user.profile(),
        queryFn: () => Promise.resolve({}) // Gerçek API çağrısı buraya gelecek
      },
      {
        queryKey: queryKeys.user.preferences(),
        queryFn: () => Promise.resolve({}) // Gerçek API çağrısı buraya gelecek
      }
    ])
  }, [warmCache])

  const warmDashboardData = useCallback(async () => {
    // Dashboard verilerini önceden yükle
    await warmCache([
      {
        queryKey: queryKeys.dashboard.stats(),
        queryFn: () => Promise.resolve({}) // Gerçek API çağrısı buraya gelecek
      },
      {
        queryKey: queryKeys.dashboard.activities(),
        queryFn: () => Promise.resolve({}) // Gerçek API çağrısı buraya gelecek
      }
    ])
  }, [warmCache])

  return {
    warmCache,
    warmUserData,
    warmDashboardData
  }
}

// Cache invalidation stratejileri
export function useCacheInvalidation() {
  const queryClient = useQueryClient()

  const invalidateRelated = useCallback((entityType: 'task' | 'project' | 'team', entityId: string) => {
    // İlgili tüm verileri invalidate et
    switch (entityType) {
      case 'task':
        cacheInvalidation.invalidateTask(queryClient, entityId)
        cacheInvalidation.invalidateDashboard(queryClient)
        break
      case 'project':
        cacheInvalidation.invalidateProject(queryClient, entityId)
        cacheInvalidation.invalidateAllTasks(queryClient)
        cacheInvalidation.invalidateDashboard(queryClient)
        break
      case 'team':
        cacheInvalidation.invalidateAllTeams(queryClient)
        cacheInvalidation.invalidateAllProjects(queryClient)
        cacheInvalidation.invalidateDashboard(queryClient)
        break
    }
  }, [queryClient])

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries()
  }, [queryClient])

  const clearCache = useCallback(() => {
    queryClient.clear()
  }, [queryClient])

  return {
    invalidateRelated,
    invalidateAll,
    clearCache
  }
}

// Selective caching için hook
interface UseSelectiveCachingOptions<T> {
  queryKey: string[]
  queryFn: () => Promise<T>
  select?: (data: T) => any
  enabled?: boolean
  staleTime?: number
}

export function useSelectiveCaching<T>({
  queryKey,
  queryFn,
  select,
  enabled = true,
  staleTime = 5 * 60_000
}: UseSelectiveCachingOptions<T>) {
  return useQuery({
    queryKey,
    queryFn,
    select,
    enabled,
    staleTime,
    // Sadece seçilen veri değiştiğinde re-render et
    structuralSharing: true
  })
}

// Cache persistence için hook
export function useCachePersistence() {
  const queryClient = useQueryClient()

  const saveCache = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    const cacheData = queries.map(query => ({
      queryKey: query.queryKey,
      data: query.state.data,
      dataUpdatedAt: query.state.dataUpdatedAt
    }))

    localStorage.setItem('react-query-cache', JSON.stringify(cacheData))
  }, [queryClient])

  const loadCache = useCallback(() => {
    try {
      const cached = localStorage.getItem('react-query-cache')
      if (!cached) return

      const cacheData = JSON.parse(cached)
      
      cacheData.forEach(({ queryKey, data, dataUpdatedAt }: any) => {
        queryClient.setQueryData(queryKey, data, {
          updatedAt: dataUpdatedAt
        })
      })
    } catch (error) {
      console.error('Cache yüklenirken hata:', error)
    }
  }, [queryClient])

  const clearPersistedCache = useCallback(() => {
    localStorage.removeItem('react-query-cache')
  }, [])

  return {
    saveCache,
    loadCache,
    clearPersistedCache
  }
}

// Smart refetch için hook
interface UseSmartRefetchOptions {
  queryKey: string[]
  refetchOnFocus?: boolean
  refetchOnReconnect?: boolean
  refetchInterval?: number
  enabled?: boolean
}

export function useSmartRefetch({
  queryKey,
  refetchOnFocus = true,
  refetchOnReconnect = true,
  refetchInterval,
  enabled = true
}: UseSmartRefetchOptions) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const handleFocus = () => {
      if (refetchOnFocus) {
        queryClient.invalidateQueries({ queryKey })
      }
    }

    const handleReconnect = () => {
      if (refetchOnReconnect) {
        queryClient.invalidateQueries({ queryKey })
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleReconnect)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleReconnect)
    }
  }, [queryClient, queryKey, refetchOnFocus, refetchOnReconnect, enabled])

  useEffect(() => {
    if (!enabled || !refetchInterval) return

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey })
    }, refetchInterval)

    return () => clearInterval(interval)
  }, [queryClient, queryKey, refetchInterval, enabled])
}

// Cache metrics için hook
export function useCacheMetrics() {
  const queryClient = useQueryClient()

  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    const stats = {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      freshQueries: queries.filter(q => !q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      cacheSize: JSON.stringify(queries).length
    }

    return stats
  }, [queryClient])

  const clearOldCache = useCallback((maxAge: number = 30 * 60 * 1000) => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    const now = Date.now()

    queries.forEach(query => {
      if (query.state.dataUpdatedAt && now - query.state.dataUpdatedAt > maxAge) {
        queryClient.removeQueries({ queryKey: query.queryKey })
      }
    })
  }, [queryClient])

  return {
    getCacheStats,
    clearOldCache
  }
}
