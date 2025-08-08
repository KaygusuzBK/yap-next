"use client"

import { useEffect, useState } from "react"
import NewTeamForm from "@/features/teams/components/NewTeamForm"
import TeamList from "@/features/teams/components/TeamList"
import NewProjectForm from "@/features/projects/components/NewProjectForm"
import ProjectList from "@/features/projects/components/ProjectList"
import { fetchProjects, type Project } from "@/features/projects/api"
import { fetchTeams, type Team } from "@/features/teams/api"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Folder, Users, Calendar, TrendingUp } from "lucide-react"

export default function Page() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [_errorProjects, setErrorProjects] = useState<string | null>(null)
  const [_errorTeams, setErrorTeams] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingProjects(true)
        setLoadingTeams(true)
        const [projectsData, teamsData] = await Promise.all([
          fetchProjects(),
          fetchTeams()
        ])
        if (mounted) {
          setProjects(projectsData)
          setTeams(teamsData)
        }
      } catch (e) {
        if (mounted) {
          setErrorProjects(e instanceof Error ? e.message : "Bir hata oluştu")
          setErrorTeams(e instanceof Error ? e.message : "Bir hata oluştu")
        }
      } finally {
        if (mounted) {
          setLoadingProjects(false)
          setLoadingTeams(false)
        }
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
                    <section className="space-y-4">
          <h2 className="text-lg font-semibold">Genel Bakış</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Proje</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? "..." : projects.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loadingProjects ? "Yükleniyor..." : "Aktif projeler"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Takım</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingTeams ? "..." : teams.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loadingTeams ? "Yükleniyor..." : "Üye olduğunuz takımlar"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif Projeler</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? "..." : projects.filter(p => p.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Devam eden projeler
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? "..." : projects.filter(p => {
                    const created = new Date(p.created_at)
                    const now = new Date()
                    return created.getMonth() === now.getMonth() && 
                           created.getFullYear() === now.getFullYear()
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bu ay oluşturulan
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-3" id="teams">
          <h1 className="text-lg font-semibold">Takımlar</h1>
          <NewTeamForm onCreated={() => setRefreshKey((k) => k + 1)} />
          <TeamList refreshKey={refreshKey} />
        </section>

        <section className="space-y-3" id="projects">
          <h2 className="text-lg font-semibold">Projeler</h2>
          <NewProjectForm onCreated={() => setRefreshKey((k) => k + 1)} />
          <ProjectList refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  )
}
