"use client"

import { useEffect, useState } from "react"
import NewTeamForm from "@/features/teams/components/NewTeamForm"
import TeamList from "@/features/teams/components/TeamList"
import { fetchProjects, type Project } from "@/features/projects/api"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function Page() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [errorProjects, setErrorProjects] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingProjects(true)
        const data = await fetchProjects()
        if (mounted) setProjects(data)
      } catch (e) {
        setErrorProjects(e instanceof Error ? e.message : "Bir hata oluştu")
      } finally {
        setLoadingProjects(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [refreshKey])

  return (
    <main className="flex flex-1 flex-col p-2 gap-4">
      <div className="w-full space-y-4">
        <section>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Ana Sayfa</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Genel Bakış</h2>
          <div className="text-sm text-muted-foreground">
            {loadingProjects ? (
              <span>Projeler yükleniyor...</span>
            ) : errorProjects ? (
              <span className="text-red-600">{errorProjects}</span>
            ) : (
              <span>Toplam proje: {projects.length}</span>
            )}
          </div>
        </section>

        <section className="space-y-3" id="teams">
          <h1 className="text-lg font-semibold">Takımlar</h1>
          <NewTeamForm onCreated={() => setRefreshKey((k) => k + 1)} />
          <TeamList refreshKey={refreshKey} />
        </section>

        <section className="space-y-3" id="projects">
          <h2 className="text-base font-semibold">Projeler</h2>
          <div className="grid gap-2">
            {loadingProjects && (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            )}
            {errorProjects && (
              <p className="text-sm text-red-600">{errorProjects}</p>
            )}
            {!loadingProjects && !errorProjects && projects.length === 0 && (
              <p className="text-sm text-muted-foreground">Henüz proje yok.</p>
            )}
            {!loadingProjects &&
              !errorProjects &&
              projects.map((p) => (
                <div key={p.id} className="border rounded-md p-3">
                  <div className="font-medium">{p.title}</div>
                  {p.description && (
                    <div className="text-sm text-muted-foreground">{p.description}</div>
                  )}
                </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  )
}
