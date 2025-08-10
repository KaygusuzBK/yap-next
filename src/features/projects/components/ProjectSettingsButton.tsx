"use client";

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProjectStatusManager from '@/features/tasks/components/ProjectStatusManager'
import { Settings } from 'lucide-react'

export default function ProjectSettingsButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setOpen(true)} className="h-8 w-8 rounded-full">
        <Settings className="h-4 w-4" />
        <span className="sr-only">Proje ayarları</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
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
                <div className="text-sm text-muted-foreground">
                  Proje başlığı, açıklama ve ekip ayarlarını proje sayfasındaki düzenle ile değiştirebilirsiniz.
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


