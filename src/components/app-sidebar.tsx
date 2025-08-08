"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Folder, ListTodo, Users, Plus, MoreVertical } from "lucide-react"
import Logo from "@/components/Logo"
import { getSupabase } from "@/lib/supabase"
import { Button } from "./ui/button"
import Input from "./ui/input"
import NewTeamForm from "@/features/teams/components/NewTeamForm"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import type { ChangeEvent } from "react"
import { updateTeamName, deleteTeam, setTeamPrimaryProject, inviteToTeam } from "@/features/teams/api"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ui/context-menu"

import { NavUser } from "@/components/nav-user"
import { Label } from "./ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar"
import { Switch } from "./ui/switch"

type TeamStat = {
  id: string
  name: string
  memberCount: number | null
  projectTitle: string | null
}

const TeamRow = React.memo(function TeamRow({
  team,
  onOpenRename,
  onDelete,
  onAssignProject,
  onAddMember,
  onSelect,
}: {
  team: TeamStat
  onOpenRename: (teamId: string, currentName: string) => void
  onDelete: (teamId: string) => void
  onAssignProject: (teamId: string) => void
  onAddMember: (teamId: string) => void
  onSelect: (teamId: string) => void
}) {
  return (
    <div
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors border-b p-4 text-sm last:border-b-0 flex items-start justify-between gap-2 rounded-sm"
      onClick={() => onSelect(team.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(team.id)
      }}
    >
      <button type="button" onClick={() => onSelect(team.id)} className="text-left">
        <div className="font-medium">{team.name}</div>
        <div className="text-xs text-muted-foreground mt-1">Üye sayısı: {team.memberCount ?? "—"}</div>
        <div className="text-xs text-muted-foreground">Proje: {team.projectTitle ?? "—"}</div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="shrink-0">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onAddMember(team.id)}>Üye Ekle</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAssignProject(team.id)}>Proje Ata</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onOpenRename(team.id, team.name)}>İsmi Değiştir</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(team.id)}>Sil</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

// This is sample data
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Görevlerim",
      url: "/dashboard#tasks",
      icon: ListTodo,
      isActive: true,
    },
    {
      title: "Projeler",
      url: "/dashboard#projects",
      icon: Folder,
      isActive: false,
    },
    {
      title: "Takımlar",
      url: "/dashboard#teams",
      icon: Users,
      isActive: false,
    },
  ],
  mails: [
    {
      name: "William Smith",
      email: "williamsmith@example.com",
      subject: "Meeting Tomorrow",
      date: "09:34 AM",
      teaser:
        "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
    },
    {
      name: "Alice Smith",
      email: "alicesmith@example.com",
      subject: "Re: Project Update",
      date: "Yesterday",
      teaser:
        "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
    },
    {
      name: "Bob Johnson",
      email: "bobjohnson@example.com",
      subject: "Weekend Plans",
      date: "2 days ago",
      teaser:
        "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day?",
    },
    {
      name: "Emily Davis",
      email: "emilydavis@example.com",
      subject: "Re: Question about Budget",
      date: "2 days ago",
      teaser:
        "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments?",
    },
    {
      name: "Michael Wilson",
      email: "michaelwilson@example.com",
      subject: "Important Announcement",
      date: "1 week ago",
      teaser:
        "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future.",
    },
    {
      name: "Sarah Brown",
      email: "sarahbrown@example.com",
      subject: "Re: Feedback on Proposal",
      date: "1 week ago",
      teaser:
        "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail?",
    },
    {
      name: "David Lee",
      email: "davidlee@example.com",
      subject: "New Project Idea",
      date: "1 week ago",
      teaser:
        "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility?",
    },
    {
      name: "Olivia Wilson",
      email: "oliviawilson@example.com",
      subject: "Vacation Plans",
      date: "1 week ago",
      teaser:
        "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave.",
    },
    {
      name: "James Martin",
      email: "jamesmartin@example.com",
      subject: "Re: Conference Registration",
      date: "1 week ago",
      teaser:
        "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end.",
    },
    {
      name: "Sophia White",
      email: "sophiawhite@example.com",
      subject: "Team Dinner",
      date: "1 week ago",
      teaser:
        "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0])
  const [mails, setMails] = React.useState(data.mails)
  const { setOpen } = useSidebar()
  const router = useRouter()
  const [teamStats, setTeamStats] = React.useState<TeamStat[]>([])
  const [loadingTeams, setLoadingTeams] = React.useState(false)
  const [teamError, setTeamError] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [renameValue, setRenameValue] = React.useState("")
  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    const found = data.navMain.find((i) => i.url.endsWith(hash))
    if (found) setActiveItem(found)
  }, [])

  // URL hash değişikliklerini dinlemeye gerek yok artık

  const fetchTeamStats = React.useCallback(async () => {
    try {
      setLoadingTeams(true)
      setTeamError(null)
      const supabase = getSupabase()
      const { data: teams, error: tErr } = await supabase
        .from("teams")
        .select("id,name")
        .order("created_at", { ascending: false })
      if (tErr) throw tErr
      const teamIds = (teams ?? []).map((t) => t.id)
      if (teamIds.length === 0) {
        setTeamStats([])
        return
      }
      const [{ data: projects }, { data: members }] = await Promise.all([
        supabase
          .from("projects")
          .select("id,title,team_id")
          .in("team_id", teamIds),
        supabase
          .from("team_members")
          .select("team_id")
          .in("team_id", teamIds),
      ])
      const teamIdToProjectTitle = new Map<string, string>()
      ;(projects ?? []).forEach((p) => {
        if (!teamIdToProjectTitle.has(p.team_id)) {
          teamIdToProjectTitle.set(p.team_id, p.title)
        }
      })
      const teamIdToCount = new Map<string, number>()
      ;(members ?? []).forEach((m) => {
        teamIdToCount.set(m.team_id, (teamIdToCount.get(m.team_id) ?? 0) + 1)
      })
      const stats = (teams ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        memberCount: teamIdToCount.get(t.id) ?? null,
        projectTitle: teamIdToProjectTitle.get(t.id) ?? null,
      }))
      setTeamStats(stats)
    } catch (e) {
      setTeamError(e instanceof Error ? e.message : "Takım verileri alınamadı")
    } finally {
      setLoadingTeams(false)
    }
  }, [])

  React.useEffect(() => {
    if (activeItem?.title !== "Takımlar") return
    fetchTeamStats()
  }, [activeItem, fetchTeamStats])

  const isTasksActive = activeItem?.title === "Görevlerim"
  const isTeamsActive = activeItem?.title === "Takımlar"

  const handleNavClick = React.useCallback(
    (item: (typeof data.navMain)[number]) => {
      setActiveItem(item)
      const shuffled = [...data.mails].sort(() => Math.random() - 0.5)
      setMails(shuffled.slice(0, Math.max(5, Math.floor(Math.random() * 10) + 1)))
      // URL'yi değiştirmiyoruz, sadece sidebar içeriğini değiştiriyoruz
      setOpen(true)
    },
    [setOpen]
  )

  const onOpenRename = React.useCallback((teamId: string, currentName: string) => {
    setSelectedTeamId(teamId)
    setRenameValue(currentName)
    setRenameOpen(true)
  }, [])

  const onDeleteTeam = React.useCallback(
    async (teamId: string) => {
      if (!confirm("Takımı silmek istediğinize emin misiniz?")) return
      await deleteTeam(teamId)
      fetchTeamStats()
    },
    [fetchTeamStats]
  )

  const [assignOpen, setAssignOpen] = React.useState(false)
  const [assignProjectId, setAssignProjectId] = React.useState<string | null>(null)
  const [teamProjects, setTeamProjects] = React.useState<Array<{ id: string; title: string }>>([])
  const [addMemberOpen, setAddMemberOpen] = React.useState(false)
  const [memberEmail, setMemberEmail] = React.useState("")

  const onAssignProject = React.useCallback(async (teamId: string) => {
    setSelectedTeamId(teamId)
    setAssignProjectId(null)
    const supabase = getSupabase()
    const { data } = await supabase
      .from("projects")
      .select("id,title")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
    setTeamProjects(data ?? [])
    setAssignOpen(true)
  }, [])

  const onAddMember = React.useCallback((teamId: string) => {
    setSelectedTeamId(teamId)
    setAddMemberOpen(true)
  }, [])

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
        >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                    <Logo size={16} className="scale-180" withLink={false} />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">YAP</span>
                    <span className="truncate text-xs">Proje Yönetimi</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => handleNavClick(item)}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
            {isTasksActive && (
              <Label className="flex items-center gap-2 text-sm">
                <span>Yapılanlar</span>
                <Switch className="shadow-none" />
              </Label>
            )}
            {isTeamsActive && (
              <Button size="icon" variant="ghost" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                <span className="sr-only">Takım oluştur</span>
              </Button>
            )}
          </div>
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {isTeamsActive ? (
                <div className="p-4">
                  {loadingTeams && (
                    <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                  )}
                  {teamError && (
                    <p className="text-sm text-red-600">{teamError}</p>
                  )}
                  {!loadingTeams && !teamError && teamStats.length === 0 && (
                    <p className="text-sm text-muted-foreground">Henüz takım yok.</p>
                  )}
                  {!loadingTeams && !teamError && (
                    <div className="flex flex-col">
                      {teamStats.map((t) => (
                        <TeamRow
                          key={t.id}
                          team={t}
                          onOpenRename={onOpenRename}
                          onDelete={onDeleteTeam}
                          onAssignProject={onAssignProject}
                          onAddMember={onAddMember}
                          onSelect={(id) => router.push(`/dashboard/teams/${id}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                mails.map((mail) => (
                  <a
                    href="#"
                    key={mail.email}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                  >
                    <div className="flex w-full items-center gap-2">
                      <span>{mail.name}</span>{" "}
                      <span className="ml-auto text-xs">{mail.date}</span>
                    </div>
                    <span className="font-medium">{mail.subject}</span>
                    <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
                      {mail.teaser}
                    </span>
                  </a>
                ))
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      {/* Takım detayı sayfasına yönlendiriliyor */}
      {/* Create Team Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Takım</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <NewTeamForm onCreated={() => { setCreateOpen(false); fetchTeamStats() }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Project Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projeyi ata</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {teamProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu takıma ait proje bulunamadı.</p>
            ) : (
              <div className="grid gap-2">
                {teamProjects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="assign-project"
                      value={p.id}
                      checked={assignProjectId === p.id}
                      onChange={() => setAssignProjectId(p.id)}
                    />
                    <span>{p.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Vazgeç</Button>
            <Button disabled={!assignProjectId || !selectedTeamId} onClick={async () => {
              if (!selectedTeamId || !assignProjectId) return
              await setTeamPrimaryProject({ team_id: selectedTeamId, project_id: assignProjectId })
              setAssignOpen(false)
              fetchTeamStats()
            }}>Ata</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Team Modal */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Takım adını değiştir</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={renameValue} onChange={(e: ChangeEvent<HTMLInputElement>) => setRenameValue(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Vazgeç</Button>
            <Button disabled={saving || !renameValue.trim()} onClick={async () => {
              if (!selectedTeamId) return
              try {
                setSaving(true)
                await updateTeamName({ team_id: selectedTeamId, name: renameValue.trim() })
                setRenameOpen(false)
                fetchTeamStats()
              } finally {
                setSaving(false)
              }
            }}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Takıma üye ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="member-email">E-posta adresi</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="ornek@email.com"
                value={memberEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setMemberEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddMemberOpen(false)
              setMemberEmail("")
            }}>Vazgeç</Button>
            <Button disabled={!memberEmail.trim() || saving} onClick={async () => {
              if (!selectedTeamId || !memberEmail.trim()) return
              try {
                setSaving(true)
                await inviteToTeam({ 
                  team_id: selectedTeamId, 
                  email: memberEmail.trim(),
                  role: "member"
                })
                setAddMemberOpen(false)
                setMemberEmail("")
                fetchTeamStats()
              } catch (error) {
                console.error("Üye ekleme hatası:", error)
                alert("Üye eklenirken bir hata oluştu. Lütfen tekrar deneyin.")
              } finally {
                setSaving(false)
              }
            }}>{saving ? "Ekleniyor..." : "Ekle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem onClick={() => setCreateOpen(true)}>Takım Oluştur</ContextMenuItem>
      <ContextMenuSeparator />
              <ContextMenuItem onClick={() => fetchTeamStats()}>Yenile</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
  )
}
