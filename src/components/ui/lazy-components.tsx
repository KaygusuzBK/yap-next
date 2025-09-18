"use client"

import React, { Suspense, lazy, ComponentType } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useLazyLoading, usePagination, useInfiniteScroll } from '@/hooks/useLazyLoading'

// Lazy loading wrapper bileşeni
interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function LazyWrapper({ 
  children, 
  fallback = <Skeleton className="h-32 w-full" />,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true
}: LazyWrapperProps) {
  const { isVisible, ref } = useLazyLoading({ threshold, rootMargin, triggerOnce })

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {isVisible ? children : fallback}
    </div>
  )
}

// Lazy image bileşeni
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: React.ReactNode
  threshold?: number
}

export function LazyImage({ 
  src, 
  alt, 
  fallback = <Skeleton className="h-32 w-full" />,
  threshold = 0.1,
  ...props 
}: LazyImageProps) {
  const { isVisible, ref } = useLazyLoading({ threshold })

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {isVisible ? (
        <img src={src} alt={alt} {...props} />
      ) : (
        fallback
      )}
    </div>
  )
}

// Lazy component loader
interface LazyComponentProps {
  component: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
  threshold?: number
}

export function LazyComponent({ 
  component, 
  fallback = <Skeleton className="h-32 w-full" />,
  threshold = 0.1
}: LazyComponentProps) {
  const { isVisible, ref } = useLazyLoading({ threshold })
  const LazyComponent = lazy(component)

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {isVisible ? (
        <Suspense fallback={fallback}>
          <LazyComponent />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}

// Pagination bileşeni
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
  maxVisiblePages?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className = ""
}: PaginationProps) {
  const getVisiblePages = () => {
    const pages: (number | string)[] = []
    const half = Math.floor(maxVisiblePages / 2)
    
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }
    
    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('...')
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...')
      }
      pages.push(totalPages)
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {showFirstLast && currentPage > 1 && (
        <button
          onClick={() => onPageChange(1)}
          className="px-3 py-2 text-sm border rounded hover:bg-muted"
        >
          İlk
        </button>
      )}
      
      {showPrevNext && currentPage > 1 && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-2 text-sm border rounded hover:bg-muted"
        >
          Önceki
        </button>
      )}
      
      {visiblePages.map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={typeof page !== 'number'}
          className={`px-3 py-2 text-sm border rounded ${
            page === currentPage
              ? 'bg-primary text-primary-foreground'
              : typeof page === 'number'
              ? 'hover:bg-muted'
              : 'cursor-default'
          }`}
        >
          {page}
        </button>
      ))}
      
      {showPrevNext && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-2 text-sm border rounded hover:bg-muted"
        >
          Sonraki
        </button>
      )}
      
      {showFirstLast && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="px-3 py-2 text-sm border rounded hover:bg-muted"
        >
          Son
        </button>
      )}
    </div>
  )
}

// Infinite scroll bileşeni
interface InfiniteScrollProps {
  children: React.ReactNode
  hasNextPage: boolean
  isFetching: boolean
  onLoadMore: () => void
  threshold?: number
  className?: string
}

export function InfiniteScroll({
  children,
  hasNextPage,
  isFetching,
  onLoadMore,
  threshold = 0.1,
  className = ""
}: InfiniteScrollProps) {
  const { ref, isIntersecting } = useInfiniteScroll({
    hasNextPage,
    isFetching,
    threshold
  })

  React.useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetching) {
      onLoadMore()
    }
  }, [isIntersecting, hasNextPage, isFetching, onLoadMore])

  return (
    <div className={className}>
      {children}
      {hasNextPage && (
        <div ref={ref as React.RefObject<HTMLDivElement>} className="h-10 flex items-center justify-center">
          {isFetching && <Skeleton className="h-8 w-8 rounded-full" />}
        </div>
      )}
    </div>
  )
}

// Virtual list bileşeni
interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ""
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const visibleItems = items.slice(startIndex, endIndex + 1)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Lazy data loader hook
interface UseLazyDataOptions<T> {
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; total: number }>
  pageSize?: number
  initialData?: T[]
}

export function useLazyData<T>({
  fetchFn,
  pageSize = 10,
  initialData = []
}: UseLazyDataOptions<T>) {
  const [data, setData] = React.useState<T[]>(initialData)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [hasMore, setHasMore] = React.useState(true)
  const [total, setTotal] = React.useState(0)

  const pagination = usePagination({
    initialPage: 1,
    pageSize,
    totalItems: total
  })

  const loadData = React.useCallback(async (page: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await fetchFn(page, pageSize)
      
      if (page === 1) {
        setData(result.data)
      } else {
        setData(prev => [...prev, ...result.data])
      }
      
      setTotal(result.total)
      setHasMore(result.data.length === pageSize)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, pageSize])

  const loadMore = React.useCallback(() => {
    if (!loading && hasMore) {
      loadData(pagination.currentPage + 1)
    }
  }, [loading, hasMore, pagination.currentPage, loadData])

  const reset = React.useCallback(() => {
    setData(initialData)
    setError(null)
    setHasMore(true)
    pagination.reset()
  }, [initialData, pagination])

  React.useEffect(() => {
    loadData(1)
  }, [loadData])

  return {
    data,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    reset,
    pagination
  }
}
