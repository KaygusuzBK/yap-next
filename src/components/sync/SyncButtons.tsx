"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Github, 
  Calendar, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface SyncButtonsProps {
  projectId?: string
  onSyncComplete?: () => void
}

export default function SyncButtons({ projectId, onSyncComplete }: SyncButtonsProps) {
  const [syncing, setSyncing] = useState<string | null>(null)

  const handleGitHubSync = async () => {
    if (!projectId) {
      toast.error('Proje seçilmedi')
      return
    }

    setSyncing('github')
    try {
      const response = await fetch('/api/sync/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          action: 'sync_issues_to_tasks'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
        onSyncComplete?.()
      } else {
        toast.error(result.message)
        if (result.errors?.length > 0) {
          console.error('Sync errors:', result.errors)
        }
      }
    } catch (error) {
      toast.error('GitHub sync hatası')
      console.error('GitHub sync error:', error)
    } finally {
      setSyncing(null)
    }
  }

  const handleCalendarSync = async () => {
    setSyncing('calendar')
    try {
      const response = await fetch('/api/sync/google-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          action: 'sync_tasks_to_calendar'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
        onSyncComplete?.()
      } else {
        toast.error(result.message)
        if (result.errors?.length > 0) {
          console.error('Sync errors:', result.errors)
        }
      }
    } catch (error) {
      toast.error('Google Calendar sync hatası')
      console.error('Calendar sync error:', error)
    } finally {
      setSyncing(null)
    }
  }

  const handleCalendarEventsSync = async () => {
    setSyncing('calendar-events')
    try {
      const response = await fetch('/api/sync/google-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_events_to_tasks'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
        onSyncComplete?.()
      } else {
        toast.error(result.message)
        if (result.errors?.length > 0) {
          console.error('Sync errors:', result.errors)
        }
      }
    } catch (error) {
      toast.error('Google Calendar events sync hatası')
      console.error('Calendar events sync error:', error)
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleGitHubSync}
        disabled={syncing === 'github' || !projectId}
        className="gap-2"
      >
        {syncing === 'github' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Github className="h-4 w-4" />
        )}
        GitHub Issues
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCalendarSync}
        disabled={syncing === 'calendar'}
        className="gap-2"
      >
        {syncing === 'calendar' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Calendar className="h-4 w-4" />
        )}
        Görevleri Calendar&apos;a
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCalendarEventsSync}
        disabled={syncing === 'calendar-events'}
        className="gap-2"
      >
        {syncing === 'calendar-events' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Calendar&apos;dan Görevler
      </Button>
    </div>
  )
}

