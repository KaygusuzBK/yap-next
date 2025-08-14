"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Input from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { fetchProjects, type Project } from "@/features/projects/api"
import { createTask, fetchProjectStatuses, type ProjectTaskStatus, getProjectMembers, assignTaskToUser } from "@/features/tasks/api"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function QuickTaskCreator() {
  const pathname = usePathname()
  const router = useRouter()

  const [open, setOpen] = React.useState(false)
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [statuses, setStatuses] = React.useState<ProjectTaskStatus[]>([])
  const [loadingStatuses, setLoadingStatuses] = React.useState(false)
  const [members, setMembers] = React.useState<Array<{ id: string; email: string; name?: string }>>([])
  const [loadingMembers, setLoadingMembers] = React.useState(false)

  const defaultProjectId = React.useMemo(() => {
    // /dashboard/projects/:id rotasındaysa, id'yi ön-seç
    const match = pathname?.match(/^\/dashboard\/projects\/([^\/]+)$/)
    return match?.[1] ?? ""
  }, [pathname])

  const [projectId, setProjectId] = React.useState<string>("")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [statusKey, setStatusKey] = React.useState<string>("")
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high' | 'urgent'>("medium")
  const [dueDateLocal, setDueDateLocal] = React.useState<string>("")
  const [assigneeId, setAssigneeId] = React.useState<string>("")
  const [notifySlack, setNotifySlack] = React.useState<boolean>(false)
  const [webhookUrl, setWebhookUrl] = React.useState<string>(process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL || "")
  const [calendarOpen, setCalendarOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    void (async () => {
      try {
        setLoadingProjects(true)
        const list = await fetchProjects()
        setProjects(list)
        // Eğer proje sayfasındaysa, o projeyi seç
        if (defaultProjectId && list.some(p => p.id === defaultProjectId)) {
          setProjectId(defaultProjectId)
        }
      } catch {
        // sessiz geç
      } finally {
        setLoadingProjects(false)
      }
    })()
  }, [open, defaultProjectId])

  // Proje değişince: durumları ve üyeleri yükle
  React.useEffect(() => {
    if (!projectId) {
      setStatuses([])
      setMembers([])
      setStatusKey("")
      setAssigneeId("")
      return
    }
    void (async () => {
      try {
        setLoadingStatuses(true)
        const sts = await fetchProjectStatuses(projectId)
        setStatuses(sts)
        // Varsayılan durum: is_default -> 'todo' grubundan ilki -> ilk kayıt
        const def = sts.find(s => s.is_default) || sts.find(s => s.group === 'todo') || sts[0]
        setStatusKey(def ? def.key : "todo")
      } catch {}
      finally {
        setLoadingStatuses(false)
      }
      try {
        setLoadingMembers(true)
        const mem = await getProjectMembers(projectId)
        setMembers(mem)
      } catch {}
      finally {
        setLoadingMembers(false)
      }
    })()
  }, [projectId])

  const resetForm = () => {
    setProjectId("")
    setTitle("")
    setDescription("")
    setStatusKey("")
    setPriority("medium")
    setDueDateLocal("")
    setAssigneeId("")
    setNotifySlack(false)
    setWebhookUrl("")
  }

  const handleCreate = async () => {
    const trimmedTitle = title.trim()
    if (!projectId) {
      toast.error("Lütfen bir proje seçin")
      return
    }
    if (!trimmedTitle) {
      toast.error("Lütfen görev başlığı girin")
      return
    }
    try {
      setCreating(true)
      const dueIso = dueDateLocal ? new Date(dueDateLocal).toISOString() : null
      const task = await createTask({
        project_id: projectId,
        title: trimmedTitle,
        description: description.trim() || null,
        priority,
        status: statusKey || 'todo',
        due_date: dueIso,
        notifySlack: notifySlack || undefined,
        slackWebhookUrl: notifySlack && webhookUrl ? webhookUrl : undefined,
      })
      if (assigneeId) {
        try { await assignTaskToUser(task.id, assigneeId) } catch {}
      }
      toast.success("Görev oluşturuldu")
      setOpen(false)
      resetForm()
      // Görev detayına git
      router.push(`/dashboard/tasks/${task.id}`)
    } catch (e) {
      const err = e as Error
      toast.error(err.message || "Görev oluşturulamadı")
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Button
        size="icon"
        aria-label="Yeni öğe"
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-1 ring-primary/20 -mt-6"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-4">
          <SheetHeader>
            <SheetTitle>Yeni Görev</SheetTitle>
            <SheetDescription>Önce proje seçin, sonra görev bilgilerini girin.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Proje</label>
              <Select value={projectId} onValueChange={setProjectId} disabled={loadingProjects}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingProjects ? "Projeler yükleniyor..." : "Proje seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Durum</label>
                <Select value={statusKey} onValueChange={setStatusKey} disabled={!projectId || loadingStatuses}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={loadingStatuses ? "Yükleniyor..." : "Durum seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Öncelik</label>
                <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Başlık</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kısa başlık"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Açıklama (opsiyonel)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detaylı açıklama"
                className="mt-1 min-h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Bitiş tarihi</label>
                <Button variant="outline" className="mt-1 w-full justify-start font-normal" onClick={() => setCalendarOpen(true)}>
                  {dueDateLocal ? new Date(dueDateLocal).toLocaleString('tr-TR') : 'Tarih seç'}
                </Button>
                <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <DialogContent className="p-3">
                    <DialogHeader>
                      <DialogTitle>Tarih seç</DialogTitle>
                    </DialogHeader>
                    <div className="pt-2">
                      <Calendar
                        mode="single"
                        selected={dueDateLocal ? new Date(dueDateLocal) : undefined}
                        onSelect={(d) => {
                          if (!d) { setDueDateLocal(""); return }
                          const local = new Date(d)
                          local.setHours(9, 0, 0, 0)
                          const isoLocal = new Date(local.getTime() - local.getTimezoneOffset()*60000).toISOString().slice(0,16)
                          setDueDateLocal(isoLocal)
                          setCalendarOpen(false)
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Atanacak kişi</label>
                <Select value={assigneeId} onValueChange={setAssigneeId} disabled={!projectId || loadingMembers}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={loadingMembers ? "Yükleniyor..." : "Seç (opsiyonel)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Seçme</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={notifySlack} onCheckedChange={(v) => setNotifySlack(Boolean(v))} />
              <span className="text-sm">Slack bildirimi gönder</span>
            </div>
            {notifySlack && (
              <div>
                <label className="text-xs text-muted-foreground">Webhook URL</label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/..."
                  className="mt-1"
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); resetForm() }} disabled={creating}>Vazgeç</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Oluştur"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}


