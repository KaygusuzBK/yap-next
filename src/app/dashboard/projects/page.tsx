"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import ProjectList from "@/features/projects/components/ProjectList"
import { Folder } from "lucide-react"
import { DashboardHeader } from "@/components/ui/dashboard-components"
import { SkeletonBreadcrumb, SkeletonHeader } from "@/components/ui/loading-states"

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
        <SkeletonBreadcrumb />
        <SkeletonHeader />
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
      <DashboardHeader
        title="Projeler"
        description="Tüm projelerin listesi"
        icon={<Folder className="h-6 w-6" />}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projeler" }
        ]}
      />
      
      {/* Project List */}
      <ProjectList />
    </main>
  )
}


