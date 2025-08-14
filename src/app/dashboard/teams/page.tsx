"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TeamList from '@/features/teams/components/TeamList'
import { useIsMobile } from '@/hooks/use-mobile'
import { ChevronRight, Users } from 'lucide-react'
import Link from 'next/link'

export default function TeamsPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !isMobile) {
      router.replace('/dashboard')
    }
  }, [isClient, isMobile, router])

  // İlk render'da loading göster (hydration hatasını önler)
  if (!isClient) {
    return (
      <div className="px-4 py-4">
        {/* Breadcrumb Skeleton */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
            <ChevronRight className="h-4 w-4" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="mb-4">
          <div className="h-7 w-32 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
        </div>
        
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!isMobile) {
    return null
  }

  return (
    <div className="px-4 py-4">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Takımlar</span>
        </nav>
      </div>
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Takımlar</h1>
        </div>
        <p className="text-muted-foreground">Tüm takımların listesi</p>
      </div>
      
      <TeamList />
    </div>
  )
}


