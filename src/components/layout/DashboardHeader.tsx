"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ArrowLeft, Home } from "lucide-react"
import { useActiveProjectStore } from '@/lib/store/project'
import { getSupabase } from '@/lib/supabase'

type Crumb = {
  label: string
  href?: string
}

type DashboardHeaderProps = {
  title: React.ReactNode
  breadcrumb?: Crumb[]
  actions?: React.ReactNode
  backHref?: string
  meta?: React.ReactNode
}

export default function DashboardHeader({
  title,
  breadcrumb = [],
  actions,
  backHref,
  meta,
}: DashboardHeaderProps) {
  const pathname = usePathname()
  const activeProjectId = useActiveProjectStore(s => s.activeProjectId)
  const setActiveProject = useActiveProjectStore(s => s.setActiveProject)
  const [projects, setProjects] = React.useState<Array<{ id: string; title: string }>>([])

  React.useEffect(() => {
    ;(async () => {
      try {
        const supabase = getSupabase()
        const { data } = await supabase.from('projects').select('id,title').order('created_at', { ascending: false })
        setProjects(data ?? [])
      } catch {}
    })()
  }, [])

  // Eğer breadcrumb prop verilmediyse, otomatik üret
  const autoBreadcrumb: Crumb[] = React.useMemo(() => {
    if (breadcrumb.length > 0) return breadcrumb
    const path = pathname || ""
    if (!path.startsWith("/dashboard")) return []
    const segments = path.split("/").filter(Boolean)
    const mapLabel = (seg: string, idx: number): Crumb => {
      // Bilinen segmentlere TR etiketler
      if (seg === "dashboard") return { label: "Dashboard", href: "/dashboard" }
      if (seg === "projects") return { label: "Projeler", href: "/dashboard/projects" }
      if (seg === "tasks") return { label: "Görevler", href: "/dashboard/tasks" }
      if (seg === "calendar") return { label: "Takvim", href: "/dashboard/tasks/calendar" }
      if (seg === "teams") return { label: "Takımlar", href: "/dashboard/teams" }
      // Dinamik segment veya id → Detay
      const base = "/" + segments.slice(0, idx + 1).join("/")
      return { label: "Detay", href: base }
    }
    const crumbs: Crumb[] = segments.map((seg, idx) => mapLabel(seg, idx))
    // Yinelenenleri kaldır (ör. birden fazla Detay)
    const dedup: Crumb[] = []
    const seen = new Set<string>()
    for (const c of crumbs) {
      const key = `${c.label}:${c.href ?? ""}`
      if (!seen.has(key)) { seen.add(key); dedup.push(c) }
    }
    return dedup
  }, [breadcrumb, pathname])

  return (
    <div className="w-full">
      <section className="flex items-center justify-between">
        <div className="flex items-start gap-2 min-w-0">
          {backHref && (
            <Link href={backHref || '/dashboard'}>
              <Button aria-label="Geri" title="Geri" variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{title}</h1>
            {meta ? <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{meta}</div> : null}
          </div>
        </div>
        <div className="flex items-center gap-2" />
      </section>
    </div>
  )
}


