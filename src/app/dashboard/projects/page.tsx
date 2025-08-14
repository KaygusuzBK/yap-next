"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import ProjectList from "@/features/projects/components/ProjectList"

export default function ProjectsMobilePage() {
  const isMobile = useIsMobile()
  const router = useRouter()

  React.useEffect(() => {
    if (!isMobile) {
      router.replace("/dashboard")
    }
  }, [isMobile, router])

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


