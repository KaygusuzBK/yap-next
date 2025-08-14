"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import ProjectList from "@/features/projects/components/ProjectList"

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
      <main className="px-3 py-3">
        <div className="mb-3">
          <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2"></div>
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
    <main className="px-3 py-3">
      <div className="mb-3">
        <h1 className="text-base font-semibold">Projeler</h1>
        <p className="text-sm text-muted-foreground">Tüm projelerin listesi</p>
      </div>
      <ProjectList />
    </main>
  )
}


