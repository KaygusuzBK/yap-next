"use client"

import * as React from "react"
import Link from "next/link"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { usePathname } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { useActiveProjectStore } from "@/lib/store/project"

type Crumb = { label: string; href?: string }

export default function GlobalHeader() {
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

  const crumbs: Crumb[] = React.useMemo(() => {
    const path = pathname || ""
    if (!path.startsWith("/dashboard")) return []
    const segments = path.split("/").filter(Boolean)
    const mapLabel = (seg: string, idx: number): Crumb => {
      if (seg === "dashboard") return { label: "Dashboard", href: "/dashboard" }
      if (seg === "projects") return { label: "Projeler", href: "/dashboard/projects" }
      if (seg === "tasks") return { label: "Görevler", href: "/dashboard/tasks" }
      if (seg === "calendar") return { label: "Takvim", href: "/dashboard/tasks/calendar" }
      if (seg === "teams") return { label: "Takımlar", href: "/dashboard/teams" }
      const base = "/" + segments.slice(0, idx + 1).join("/")
      return { label: "Detay", href: base }
    }
    const arr: Crumb[] = segments.map((s, i) => mapLabel(s, i))
    const dedup: Crumb[] = []
    const seen = new Set<string>()
    for (const c of arr) {
      const key = `${c.label}:${c.href ?? ''}`
      if (!seen.has(key)) { seen.add(key); dedup.push(c) }
    }
    return dedup
  }, [pathname])

  return (
    <div className="sticky top-0 z-30 w-full border-b bg-sidebar">
      <div className="flex h-10 items-center gap-3 px-3">
        {crumbs.length > 0 && (
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            {crumbs.map((c, idx) => {
              const isLast = idx === crumbs.length - 1
              return (
                <React.Fragment key={`${c.label}-${idx}`}>
                  {isLast || !c.href ? (
                    <span className="truncate max-w-[200px] md:max-w-[320px]">{c.label}</span>
                  ) : (
                    <Link href={c.href} className="hover:underline truncate max-w-[200px] md:max-w-[320px]">{c.label}</Link>
                  )}
                  {!isLast && <span className="opacity-50">/</span>}
                </React.Fragment>
              )
            })}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <Popover>
            <PopoverTrigger className="h-8 px-2 rounded border text-sm bg-background">
              {projects.find(p => p.id === activeProjectId)?.title || 'Tüm Projeler'}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-0">
              <div className="max-h-64 overflow-auto py-1">
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => setActiveProject(null)}
                >
                  Tüm Projeler
                </button>
                {projects.map(p => (
                  <button
                    key={p.id}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${activeProjectId === p.id ? 'bg-muted' : ''}`}
                    onClick={() => setActiveProject(p.id)}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}


