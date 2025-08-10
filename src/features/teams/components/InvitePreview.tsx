"use client";

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  to: string
  teamName?: string | null
  inviteUrl: string
}

export default function InvitePreview({ open, onOpenChange, to, teamName, inviteUrl }: Props) {
  const subject = useMemo(() => `${teamName ?? 'Takım'} daveti`, [teamName])
  const body = useMemo(() => `Merhaba,\n\nSeni ${teamName ?? 'takımımıza'} davet ediyorum. Daveti kabul etmek için aşağıdaki linke tıklayabilirsin:\n\n${inviteUrl}\n\nSevgiler.`, [teamName, inviteUrl])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Davet E-postası</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Kime</div>
            <div className="rounded-md border px-3 py-2 text-sm bg-muted/20 break-all">{to}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Konu</div>
            <div className="rounded-md border px-3 py-2 text-sm bg-muted/20 break-all">{subject}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">İçerik</div>
            <textarea className="w-full min-h-32 rounded-md border px-3 py-2 text-sm bg-muted/20" readOnly value={body} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => { navigator.clipboard.writeText(subject) }}
              variant="outline"
            >Konu Kopyala</Button>
            <Button
              onClick={() => { navigator.clipboard.writeText(body) }}
              variant="outline"
            >İçeriği Kopyala</Button>
            <Button
              onClick={() => { navigator.clipboard.writeText(inviteUrl) }}
              variant="outline"
            >Linki Kopyala</Button>
            <Button
              onClick={() => {
                const s = encodeURIComponent(subject)
                const b = encodeURIComponent(body)
                window.location.href = `mailto:${to}?subject=${s}&body=${b}`
              }}
            >Mail Uygulamasında Aç</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


