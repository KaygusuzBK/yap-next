"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import ProjectList from "@/features/projects/components/ProjectList"
import { ChevronRight, Folder } from "lucide-react"
import Link from "next/link"

export default function ProjectsMobilePage() {
  const isMobile = useIsMobile()
  const router = useRouter()
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  React.useEffect(() => {
    if (isClient && !isMobile) {
      router.replace("/dashboard")
    }
  }, [isClient, isMobile, router])

  // İlk render'da loading göster (hydration hatasını önler)
  if (!isClient) {
    return (
      <main className="px-4 py-4">
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
      </main>
    )
  }

  if (!isMobile) return null

  return (
    <main className="px-4 py-4">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Projeler</span>
        </nav>
      </div>
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Folder className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Projeler</h1>
        </div>
        <p className="text-muted-foreground">Tüm projelerin listesi</p>
      </div>
      
      {/* Project List */}
      <ProjectList />
    </main>
  )
}


