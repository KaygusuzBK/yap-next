"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import NewTeamForm from "@/features/teams/components/NewTeamForm"
import NewProjectForm from "@/features/projects/components/NewProjectForm"
import NewTaskForm from "@/features/tasks/components/NewTaskForm"
import { TaskRow } from "../TaskRow"
import type { ChangeEvent } from "react"
import type { ProjectStat, TaskStat } from "../types"

interface SidebarModalsProps {
  // Team modals
  createOpen: boolean
  setCreateOpen: (open: boolean) => void
  createTeamOpen: boolean
  setCreateTeamOpen: (open: boolean) => void
  renameOpen: boolean
  setRenameOpen: (open: boolean) => void
  renameValue: string
  setRenameValue: (value: string) => void
  selectedTeamId: string | null
  saving: boolean
  setSaving: (saving: boolean) => void
  onRenameTeam: () => void
  onDeleteTeam: (teamId: string) => void
  fetchTeamStats: () => void

  // Project modals
  createProjectOpen: boolean
  setCreateProjectOpen: (open: boolean) => void
  assignOpen: boolean
  setAssignOpen: (open: boolean) => void
  assignProjectId: string | null
  setAssignProjectId: (id: string | null) => void
  teamProjects: Array<{ id: string; title: string }>
  onAssignProject: () => void

  // Task modals
  createTaskOpen: boolean
  setCreateTaskOpen: (open: boolean) => void
  taskProjectId: string | null
  setTaskProjectId: (id: string | null) => void
  myTasksOpen: boolean
  setMyTasksOpen: (open: boolean) => void
  taskStats: TaskStat[]
  projectStats: ProjectStat[]
  onTaskSelect: (taskId: string) => void
  onTaskStatusChange: (taskId: string, status: TaskStat['status']) => void
  onTaskCreated: () => void
  isTasksActive: boolean

  // Member modals
  addMemberOpen: boolean
  setAddMemberOpen: (open: boolean) => void
  memberEmail: string
  setMemberEmail: (email: string) => void
  onAddMember: () => void

  // Task filters
  taskStatusFilter: 'all' | 'open' | 'completed'
  taskDueFilter: 'all' | 'overdue' | 'today' | 'week'
  taskPriorityFilter: 'all' | 'urgent' | 'high' | 'medium' | 'low'
  taskSortBy: 'smart' | 'due' | 'priority'
}

export function SidebarModals({
  createOpen,
  setCreateOpen,
  createTeamOpen,
  setCreateTeamOpen,
  renameOpen,
  setRenameOpen,
  renameValue,
  setRenameValue,
  selectedTeamId,
  saving,
  setSaving,
  onRenameTeam,
  onDeleteTeam,
  fetchTeamStats,
  createProjectOpen,
  setCreateProjectOpen,
  assignOpen,
  setAssignOpen,
  assignProjectId,
  setAssignProjectId,
  teamProjects,
  onAssignProject,
  createTaskOpen,
  setCreateTaskOpen,
  taskProjectId,
  setTaskProjectId,
  myTasksOpen,
  setMyTasksOpen,
  taskStats,
  projectStats,
  onTaskSelect,
  onTaskStatusChange,
  onTaskCreated,
  isTasksActive,
  addMemberOpen,
  setAddMemberOpen,
  memberEmail,
  setMemberEmail,
  onAddMember,
  taskStatusFilter,
  taskDueFilter,
  taskPriorityFilter,
  taskSortBy
}: SidebarModalsProps) {
  const filteredTasks = taskStats.filter(t => {
    if (taskStatusFilter === 'open' && t.status === 'completed') return false
    if (taskStatusFilter === 'completed' && t.status !== 'completed') return false
    if (taskDueFilter === 'overdue' && !(t.days_remaining !== null && t.days_remaining < 0)) return false
    if (taskDueFilter === 'today' && !(t.days_remaining === 0)) return false
    if (taskDueFilter === 'week' && !(t.days_remaining !== null && t.days_remaining >= 0 && t.days_remaining <= 7)) return false
    if (taskPriorityFilter !== 'all' && t.priority !== taskPriorityFilter) return false
    return true
  })

  return (
    <>
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

      {/* Create Team Modal (from Teams section) */}
      <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Takım</DialogTitle>
          </DialogHeader>
          <NewTeamForm startExpanded onCreated={() => setCreateTeamOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Proje</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <NewProjectForm onCreated={async () => { setCreateProjectOpen(false) }} />
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
            <Button disabled={!assignProjectId || !selectedTeamId} onClick={onAssignProject}>
              Ata
            </Button>
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
            <Button disabled={saving || !renameValue.trim()} onClick={onRenameTeam}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal */}
      <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{taskProjectId ? 'Yeni Görev Oluştur' : 'Proje Seçin'}</DialogTitle>
          </DialogHeader>
          {!taskProjectId ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Görev oluşturmak için önce bir proje seçmelisiniz.
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Proje Seçin</Label>
                <Select value={taskProjectId ?? ''} onValueChange={(v) => setTaskProjectId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir proje seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStats.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Henüz proje yok
                      </div>
                    ) : (
                      projectStats.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <span>{p.title}</span>
                            <span className="text-xs text-muted-foreground">
                              ({p.status === 'active' ? 'Aktif' : p.status === 'completed' ? 'Tamamlandı' : 'Arşivlenmiş'})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateTaskOpen(false)}>Vazgeç</Button>
                <Button 
                  disabled={!taskProjectId} 
                  onClick={() => taskProjectId && setTaskProjectId(taskProjectId)}
                >
                  Devam Et
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="pt-2">
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium">Seçilen Proje:</div>
                <div className="text-sm text-muted-foreground">
                  {projectStats.find(p => p.id === taskProjectId)?.title}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTaskProjectId(null)}
                  className="mt-2 h-6 px-2 text-xs"
                >
                  Değiştir
                </Button>
              </div>
              <NewTaskForm 
                projectId={taskProjectId}
                onCreated={onTaskCreated}
                onCancel={() => { setCreateTaskOpen(false); setTaskProjectId(null) }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Görevlerim Dialog */}
      <Dialog open={myTasksOpen} onOpenChange={setMyTasksOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Görevlerim</DialogTitle>
          </DialogHeader>
          {filteredTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Görev yok.</p>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onSelect={onTaskSelect}
                  onStatusChange={onTaskStatusChange}
                />
              ))}
            </div>
          )}
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
            <Button disabled={!memberEmail.trim() || saving} onClick={onAddMember}>
              {saving ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
