"use client"

import { useEffect, useState } from "react"
import NewTeamForm from "@/features/teams/components/NewTeamForm"
import TeamList from "@/features/teams/components/TeamList"
import NewProjectForm from "@/features/projects/components/NewProjectForm"
import ProjectList from "@/features/projects/components/ProjectList"
import { fetchProjects, type Project } from "@/features/projects/api"
import { fetchTeams, type Team } from "@/features/teams/api"
import { useI18n } from "@/i18n/I18nProvider"
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
  const { t } = useI18n()
  const [refreshKey, setRefreshKey] = useState(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)

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
          console.error("Veri yükleme hatası:", e)
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
                <BreadcrumbLink href="/">{t('dashboard.breadcrumb.home')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('dashboard.breadcrumb.dashboard')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </section>
                    <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dashboard.overview.title')}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.totalProjects')}</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? "..." : projects.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loadingProjects ? t('common.loading') : t('dashboard.overview.totalProjectsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.totalTeams')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingTeams ? "..." : teams.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loadingTeams ? t('common.loading') : t('dashboard.overview.totalTeamsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.activeProjects')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? "..." : projects.filter(p => p.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.overview.activeProjectsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.thisMonth')}</CardTitle>
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
                  {t('dashboard.overview.thisMonthDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-3" id="teams">
          <h1 className="text-lg font-semibold">{t('dashboard.sections.teams')}</h1>
          <NewTeamForm onCreated={() => setRefreshKey((k) => k + 1)} />
          <TeamList refreshKey={refreshKey} />
        </section>

        <section className="space-y-3" id="projects">
          <h2 className="text-lg font-semibold">{t('dashboard.sections.projects')}</h2>
          <NewProjectForm onCreated={() => setRefreshKey((k) => k + 1)} />
          <ProjectList refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  )
}
