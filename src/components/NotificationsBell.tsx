"use client";

import { useEffect, useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import { listNotifications, markNotificationRead, subscribeNotifications, type AppNotification } from '@/lib/services/notifications/notificationService'
import Link from 'next/link'

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

export default function NotificationsBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const unreadCount = useMemo(() => items.filter(i => !i.read_at).length, [items])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await listNotifications(20)
        if (mounted) setItems(list)
      } catch {}
    })()
    const unsub = subscribeNotifications((n) => {
      setItems((prev) => [n, ...prev].slice(0, 50))
    }, { userId })
    return () => { mounted = false; try { unsub() } catch {} }
  }, [userId])

  const handleMarkRead = async (id: string) => {
    try {
      setItems(prev => prev.map(x => x.id === id ? { ...x, read_at: new Date().toISOString() } : x))
      await markNotificationRead(id)
    } catch {}
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Bildirimler"
        className="relative inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted"
        onClick={() => setOpen(o => !o)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 text-center text-[10px] leading-5 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow">
          <div className="border-b px-3 py-2 text-sm font-medium">Bildirimler</div>
          <div className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">Henüz bildirim yok</div>
            ) : (
              <ul className="divide-y">
                {items.map((n) => {
                  const payload = (n.payload || {}) as Record<string, unknown>
                  const url = typeof payload.url === 'string' ? payload.url : undefined
                  const text = n.type === 'mention' ? 'Bir yorumda sizden bahsedildi' : n.type
                  const content = (
                    <div className="flex items-start gap-2">
                      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-muted-foreground/30' : 'bg-blue-600'}`} />
                      <div className="min-w-0">
                        <div className="truncate text-sm">{text}</div>
                        <div className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  )
                  return (
                    <li key={n.id} className="px-3 py-2 hover:bg-accent/40">
                      {url ? (
                        <Link href={url} onClick={() => handleMarkRead(n.id)}>{content}</Link>
                      ) : (
                        <button type="button" className="w-full text-left" onClick={() => handleMarkRead(n.id)}>
                          {content}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


