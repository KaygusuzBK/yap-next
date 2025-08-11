"use client";

import DashboardHeader from '@/components/layout/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { listNotifications, markNotificationRead } from '@/lib/services/notifications/notificationService'
import { useEffect, useState } from 'react'

type Row = Awaited<ReturnType<typeof listNotifications>>[number]

function timeAgo(dateString: string): string {
  const d = new Date(dateString).getTime()
  const diff = Math.max(0, Date.now() - d)
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'şimdi'
  if (minutes < 60) return `${minutes} dk`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa`
  const days = Math.floor(hours / 24)
  return `${days} g`
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    ;(async () => {
      try {
        const rows = await listNotifications(100)
        setItems(rows)
      } finally {
        setLoading(false)
      }
    })()
  }, [])
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <DashboardHeader
        title="Bildirimler"
        backHref="/dashboard"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bildirimler' }]}
      />
      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Son Bildirimler</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-sm text-muted-foreground">Henüz bildirim yok.</div>
            ) : (
              <ul className="divide-y">
                {items.map((n) => {
                  const payload = (n.payload || {}) as Record<string, unknown>
                  const url = typeof payload.url === 'string' ? payload.url : undefined
                  const text = n.type === 'mention' ? 'Bir yorumda sizden bahsedildi' : n.type
                  return (
                    <li key={n.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm">{text}</div>
                        <div className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {url && (
                          <a className="text-sm underline" href={url}>Aç</a>
                        )}
                        {!n.read_at ? (
                          <button className="text-sm" onClick={async () => {
                            await markNotificationRead(n.id)
                            setItems(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
                          }}>Okundu işaretle</button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Okundu</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


