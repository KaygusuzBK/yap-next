"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TeamList from '@/features/teams/components/TeamList'
import { useIsMobile } from '@/hooks/use-mobile'

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
      <div className="p-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4"></div>
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Takımlar</h1>
      <TeamList />
    </div>
  )
}


