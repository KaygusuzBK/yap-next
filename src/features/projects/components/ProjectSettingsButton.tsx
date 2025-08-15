"use client";

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProjectStatusManager from '@/features/tasks/components/ProjectStatusManager'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProjectSlackChannel, getProjectById } from '@/features/projects/api'
import { toast } from 'sonner'
import { Settings } from 'lucide-react'
import { usePreferencesStore, type Locale } from '@/lib/store/preferences'
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function ProjectSettingsButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState('')
  const enabledLocales = usePreferencesStore(s => s.enabledLocales)
  const setEnabledLocales = usePreferencesStore(s => s.setEnabledLocales)

  async function load() {
    try { const p = await getProjectById(projectId); setChannel(p?.slack_channel_id ?? '') } catch {}
  }
  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setOpen(true)} className="h-8 w-8 rounded-full">
        <Settings className="h-4 w-4" />
        <span className="sr-only">Proje ayarları</span>
      </Button>
      <Dialog open={open} onOpenChange={(v)=>{ setOpen(v); if (v) load() }}>
        <DialogContent className="max-w-screen-2xl w-[99vw] md:w-[96vw] p-0 overflow-hidden max-h-[95vh]">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Proje Ayarları</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 pt-4 overflow-y-auto">
            <Tabs defaultValue="statuses" className="space-y-4">
              <TabsList>
                <TabsTrigger value="general">Genel</TabsTrigger>
                <TabsTrigger value="statuses">Durumlar</TabsTrigger>
              </TabsList>
              <TabsContent value="general">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Slack Kanal ID</Label>
                    <div className="flex gap-2">
                      <Input placeholder="C0123456789" value={channel} onChange={(e)=>setChannel(e.target.value)} />
                      <Button onClick={async()=>{
                        try { await updateProjectSlackChannel({ id: projectId, slack_channel_id: channel.trim() || null }); toast.success('Slack kanalı kaydedildi') } catch(e){ toast.error(e instanceof Error ? e.message : 'Kaydedilemedi') }
                      }}>Kaydet</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Örn: C0123456789 (kanal detaylarından ID&#39;yi kopyalayın)</p>
                  </div>

                  <div className="space-y-1">
                    <Label>Aktif Diller</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-fit">Dilleri Seç</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        {(['tr','en','de','es','fr','ar','zh-CN'] as Locale[]).map(code => (
                          <DropdownMenuCheckboxItem
                            key={code}
                            checked={enabledLocales.includes(code)}
                            onCheckedChange={(checked) => {
                              const set = new Set(enabledLocales)
                              if (checked) set.add(code); else set.delete(code)
                              setEnabledLocales(Array.from(set))
                            }}
                          >
                            {code}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <p className="text-xs text-muted-foreground">Dil seçici sadece seçilen dilleri gösterir. Boşsa tüm diller görünür.</p>
                  </div>

                  <div className="space-y-1">
                    <Label>GitHub Entegrasyonu</Label>
                    <form action="/api/github/link" method="post" className="grid gap-2">
                      <input type="hidden" name="project_id" value={projectId} />
                      <div className="grid md:grid-cols-3 gap-2">
                        <Input name="repo_owner" placeholder="owner" required />
                        <Input name="repo_name" placeholder="repo" required />
                        <Input name="installation_id" placeholder="installation_id" required />
                      </div>
                      <div>
                        <Button type="submit" variant="secondary" size="sm">Bağla</Button>
                      </div>
                    </form>
                    <p className="text-xs text-muted-foreground">GitHub App kurulumundan aldığınız installation_id ile owner/repo bilgilerini girin.</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="statuses">
                <ProjectStatusManager projectId={projectId} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


