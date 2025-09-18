"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseLazyLoadingOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

interface UseLazyLoadingReturn {
  isVisible: boolean
  ref: React.RefObject<HTMLElement>
}

// Intersection Observer ile lazy loading
export function useLazyLoading(options: UseLazyLoadingOptions = {}): UseLazyLoadingReturn {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce])

  return { isVisible, ref }
}

// Pagination ile lazy loading
interface UsePaginationOptions {
  initialPage?: number
  pageSize?: number
  totalItems?: number
}

interface UsePaginationReturn {
  currentPage: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  reset: () => void
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    pageSize = 10,
    totalItems = 0
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const totalPages = Math.ceil(totalItems / pageSize)
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasNextPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1)
    }
  }, [hasPreviousPage])

  const reset = useCallback(() => {
    setCurrentPage(initialPage)
  }, [initialPage])

  return {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    reset
  }
}

// Infinite scroll ile lazy loading
interface UseInfiniteScrollOptions {
  hasNextPage?: boolean
  isFetching?: boolean
  threshold?: number
}

interface UseInfiniteScrollReturn {
  ref: React.RefObject<HTMLElement>
  isIntersecting: boolean
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions = {}): UseInfiniteScrollReturn {
  const {
    hasNextPage = false,
    isFetching = false,
    threshold = 0.1
  } = options

  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !hasNextPage || isFetching) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold,
        rootMargin: '100px',
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [hasNextPage, isFetching, threshold])

  return { ref, isIntersecting }
}

// Virtual scrolling için hook
interface UseVirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  itemCount: number
  overscan?: number
}

interface UseVirtualScrollReturn {
  startIndex: number
  endIndex: number
  totalHeight: number
  offsetY: number
  visibleItems: number[]
}

export function useVirtualScroll(options: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const {
    itemHeight,
    containerHeight,
    itemCount,
    overscan = 5
  } = options

  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const totalHeight = itemCount * itemHeight
  const offsetY = startIndex * itemHeight

  const visibleItems = Array.from(
    { length: endIndex - startIndex + 1 },
    (_, i) => startIndex + i
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    visibleItems,
    handleScroll
  } as UseVirtualScrollReturn & { handleScroll: (e: React.UIEvent<HTMLDivElement>) => void }
}
