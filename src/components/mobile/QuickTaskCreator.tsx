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
import { createTask } from "@/features/tasks/api"

export default function QuickTaskCreator() {
  const pathname = usePathname()
  const router = useRouter()

  const [open, setOpen] = React.useState(false)
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = React.useState(false)
  const [creating, setCreating] = React.useState(false)

  const defaultProjectId = React.useMemo(() => {
    // /dashboard/projects/:id rotasındaysa, id'yi ön-seç
    const match = pathname?.match(/^\/dashboard\/projects\/([^\/]+)$/)
    return match?.[1] ?? ""
  }, [pathname])

  const [projectId, setProjectId] = React.useState<string>("")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")

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
      } catch (e) {
        // sessiz geç
      } finally {
        setLoadingProjects(false)
      }
    })()
  }, [open, defaultProjectId])

  const resetForm = () => {
    setProjectId("")
    setTitle("")
    setDescription("")
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
      const task = await createTask({ project_id: projectId, title: trimmedTitle, description: description.trim() || null })
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


