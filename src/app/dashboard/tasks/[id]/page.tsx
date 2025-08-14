"use client";

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  Edit, 
  MessageSquare, 
  FileText, 
  History,
  Plus,
  Loader2,
  Folder
} from 'lucide-react';
import { fetchTaskById, getProjectMembers, fetchComments, addComment, deleteComment, listTaskFiles, uploadTaskFile, deleteTaskFile, fetchTaskActivities, fetchTaskTimeLogs, fetchProjectStatuses, addTimeLog, startTimeLog, stopTimeLog, type Task, type TaskComment, type TaskFile, type TaskActivity, type TaskTimeLog, type ProjectTaskStatus } from '../../../../features/tasks/api';
import { toast } from 'sonner';
import TaskEditForm from '../../../../features/tasks/components/TaskEditForm';
import TaskAssignment from '../../../../features/tasks/components/TaskAssignment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { useI18n } from '@/i18n/I18nProvider';
import DashboardHeader from '@/components/layout/DashboardHeader';
// import Image from 'next/image';

export default function TaskDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [projectMembers, setProjectMembers] = useState<Array<{ id: string; email: string; name?: string }>>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [commentLoading, setCommentLoading] = useState(false);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [ogPreview, setOgPreview] = useState<{ url: string; title?: string; description?: string; image?: string; siteName?: string } | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [mentionRecents, setMentionRecents] = useState<string[]>([])
  const [activities, setActivities] = useState<TaskActivity[]>([])
  const [timeLogs, setTimeLogs] = useState<TaskTimeLog[]>([])
  const [projectStatuses, setProjectStatuses] = useState<ProjectTaskStatus[]>([])
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logStart, setLogStart] = useState<string>('')
  const [logEnd, setLogEnd] = useState<string>('')
  const [logDesc, setLogDesc] = useState<string>('')
  const [logSaving, setLogSaving] = useState(false)

  const loadTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const taskData = await fetchTaskById(taskId);
      setTask(taskData);
      
      // Proje üyelerini de yükle
      try {
        const members = await getProjectMembers(taskData.project_id);
        setProjectMembers(members);
    } catch {
        // ignore
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Görev yüklenirken bir hata oluştu');
      toast.error('Görev yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      loadTask();
      // load comments
      fetchComments(taskId).then(setComments).catch(() => {});
      // load files
      listTaskFiles(taskId).then(setFiles).catch(() => {});
      // load history
      fetchTaskActivities(taskId)
        .then(setActivities)
        .catch((e) => { console.error('Aktiviteler yüklenemedi', e); toast.error('Aktiviteler yüklenemedi'); });
      fetchTaskTimeLogs(taskId)
        .then(setTimeLogs)
        .catch((e) => { console.error('Zaman kayıtları yüklenemedi', e); });
    }
  }, [taskId, loadTask]);

  // Load project-specific status definitions for labels/colors
  useEffect(() => {
    (async () => {
      try {
        if (!task) return
        const defs = await fetchProjectStatuses(task.project_id)
        setProjectStatuses(defs)
      } catch {
        // noop
      }
    })()
  }, [task])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const saved = await uploadTaskFile(task.id, file);
      setFiles((prev) => [...prev, saved]);
    } catch {
      toast.error('Dosya yüklenemedi');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (path: string) => {
    try {
      await deleteTaskFile(path);
      setFiles((prev) => prev.filter((f) => f.path !== path));
    } catch {
      toast.error('Dosya silinemedi');
    }
  };

  const handleAddComment = async () => {
    const content = newComment.trim();
    if (!content || !task) return;
    try {
      setCommentLoading(true);
      const created = await addComment(task.id, content);
      setComments((prev) => [...prev, created]);
      setNewComment('');
      setOgPreview(null)

      // Detect mentions and notify server (best-effort)
      try {
        const ids = projectMembers
          .filter((m) => {
            const label = m.name || (m.email?.split('@')[0] ?? '')
            return content.includes(`@${label}`)
          })
          .map((m) => m.id)
        if (ids.length > 0) {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || ''
          const url = baseUrl ? `${baseUrl}/dashboard/tasks/${task.id}` : undefined
          await fetch('/api/notifications/mention', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: task.id, comment_id: created.id, comment_text: content, mentioned_user_ids: ids, task_url: url })
          }).catch(() => {})
        }
      } catch {}
    } catch {
      toast.error('Yorum eklenemedi');
    } finally {
      setCommentLoading(false);
    }
  };

  // Mention detection and suggestion list
  const mentionCandidates = React.useMemo(() => {
    if (!mentionOpen) return [] as Array<{ id: string; label: string; email: string }>
    const q = mentionQuery.trim().toLowerCase()
    const base = projectMembers.map((m) => ({ id: m.id, label: m.name || (m.email?.split('@')[0] ?? ''), email: m.email ?? '' }))
    if (!q) {
      // put recents first
      const byId: Record<string, { id: string; label: string; email: string }> = Object.fromEntries(base.map(x => [x.id, x]))
      const ordered: Array<{ id: string; label: string; email: string }> = []
      for (const id of mentionRecents) { if (byId[id]) ordered.push(byId[id]) }
      for (const item of base) { if (!mentionRecents.includes(item.id)) ordered.push(item) }
      return ordered.slice(0, 6)
    }
    return base.filter((c) => c.label.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 6)
  }, [mentionOpen, mentionQuery, projectMembers, mentionRecents])

  const handleCommentInput = (val: string) => {
    setNewComment(val)
    // parse last @token
    const at = val.lastIndexOf('@')
    if (at >= 0) {
      // ensure there is a separator before @ (start or whitespace) and no space until caret
      const before = at === 0 ? ' ' : val[at - 1]
      const after = val.slice(at + 1)
      if ((before.trim() === '' || at === 0) && !after.includes(' ')) {
        setMentionOpen(true)
        setMentionQuery(after)
        setMentionIndex(0)
        return
      }
    }
    setMentionOpen(false)
  }

  const insertMention = (candidate: { id: string; label: string }) => {
    const at = newComment.lastIndexOf('@')
    if (at < 0) return
    const prefix = newComment.slice(0, at)
    const mentionText = `@${candidate.label}`
    setNewComment(prefix + mentionText + ' ')
    setMentionOpen(false)
    // update recents in localStorage
    try {
      const key = 'mentionRecents'
      const prev: string[] = JSON.parse(localStorage.getItem(key) || '[]')
      const next = [candidate.id, ...prev.filter((x) => x !== candidate.id)].slice(0, 8)
      localStorage.setItem(key, JSON.stringify(next))
      setMentionRecents(next)
    } catch { /* ignore */ }
  }

  function renderCommentText(text: string) {
    // simple emoji shortcodes
    const emojiMap: Record<string, string> = {
      ':smile:': '😄', ':thumbsup:': '👍', ':fire:': '🔥', ':heart:': '❤️', ':tada:': '🎉'
    }
    let replaced = text
    for (const [k, v] of Object.entries(emojiMap)) {
      replaced = replaced.split(k).join(v)
    }
    // linkify
    const parts: Array<React.ReactNode> = []
    const urlRegex = /(https?:\/\/[^\s]+)/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = urlRegex.exec(replaced)) !== null) {
      const [url] = match
      const start = match.index
      if (start > lastIndex) parts.push(replaced.slice(lastIndex, start))
      parts.push(
        <a key={start} href={url} target="_blank" rel="noreferrer" className="underline text-primary break-all">
          {url}
        </a>
      )
      lastIndex = start + url.length
    }
    if (lastIndex < replaced.length) parts.push(replaced.slice(lastIndex))
    return parts
  }

  // Try to fetch OG preview when a URL is present in comment box
  useEffect(() => {
    const urlMatch = newComment.match(/https?:\/\/[^\s]+/)
    if (!urlMatch) { setOgPreview(null); return }
    const url = urlMatch[0]
    let active = true
    const run = async () => {
      try {
        const res = await fetch(`/api/og/preview?url=${encodeURIComponent(url)}`)
        const data = await res.json()
        if (!active) return
        if (data && (data.title || data.description || data.image)) {
          setOgPreview(data)
        } else {
          setOgPreview(null)
        }
      } catch {
        if (active) setOgPreview(null)
      }
    }
    // debounce slightly
    const id = setTimeout(run, 450)
    return () => { active = false; clearTimeout(id) }
  }, [newComment])

  // Load mention recents once
  useEffect(() => {
    try {
      const key = 'mentionRecents'
      const prev: string[] = JSON.parse(localStorage.getItem(key) || '[]')
      setMentionRecents(prev)
    } catch { /* ignore */ }
  }, [])

  const handleDeleteComment = async (id: string) => {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error('Yorum silinemedi');
    }
  };

  const handleAssignmentChange = () => {
    loadTask(); // Görevi yeniden yükle
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'in_progress':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'review':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: string) => {
    // Prefer project-defined label
    const map: Record<string, string> = Object.fromEntries(projectStatuses.map(s => [s.key, s.label]))
    if (map[status]) return map[status]
    // i18n keys support
    if (status.startsWith('taskStatus.')) return t(status)
    // Fallback to base keys
    if (status === 'todo') return t('taskStatus.todo') || 'Todo'
    if (status === 'in_progress') return t('taskStatus.in_progress') || 'In Progress'
    if (status === 'review') return t('taskStatus.review') || 'Review'
    if (status === 'completed') return t('taskStatus.completed') || 'Completed'
    return status
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return <Badge variant="secondary">Düşük</Badge>;
      case 'medium':
        return <Badge variant="default">Orta</Badge>;
      case 'high':
        return <Badge variant="destructive">Yüksek</Badge>;
      case 'urgent':
        return <Badge variant="destructive" className="bg-red-600">Acil</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const loc = locale === 'tr' ? 'tr-TR' : 'en-US'
    return new Date(dateString).toLocaleDateString(loc, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserLabelById = (userId?: string | null): string => {
    if (!userId) return '—'
    const m = projectMembers.find(x => x.id === userId)
    if (m) return m.name || (m.email?.split('@')[0] ?? m.email) || userId
    return userId
  }

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} ${t('task.date.late')}`;
    if (diffDays === 0) return t('task.date.today');
    if (diffDays === 1) return t('task.date.oneDay');
    return `${diffDays} ${t('task.date.daysLeft')}`;
  };

  const getDaysRemainingColor = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600';
    if (diffDays <= 1) return 'text-orange-600';
    if (diffDays <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}sa ${minutes}dk ${secs}sn`
    if (minutes > 0) return `${minutes}dk ${secs}sn`
    return `${secs}sn`
  }

  // De-duplicate activities that are effectively the same (double triggers)
  const cleanActivities = React.useMemo(() => {
    const seen = new Set<string>()
    const list: TaskActivity[] = []
    for (const a of activities) {
      const det = a.details as Record<string, unknown> | null
      const st = det && typeof det === 'object' ? (det.status as { old?: string; new?: string } | string | undefined) : undefined
      let key = `${a.created_at}|${a.action}`
      if (typeof st === 'string') key += `|${st}`
      else if (st && typeof st === 'object') key += `|${st.old ?? ''}->${st.new ?? ''}`
      if (!seen.has(key)) { seen.add(key); list.push(a) }
    }
    return list
  }, [activities])

  const computeStatusDurations = React.useMemo(() => {
    // derive status change moments from activities where details.status exists
    type Change = { at: string; from?: string | null; to?: string | null }
    const changes: Change[] = []
    for (const a of cleanActivities) {
      const detailsObj = a.details as Record<string, unknown> | null
      const stField = detailsObj && typeof detailsObj === 'object' ? (detailsObj.status as { old?: string; new?: string } | string | undefined) : undefined
      if (stField && typeof stField === 'object' && (stField.old !== stField.new)) {
        changes.push({ at: a.created_at, from: stField.old ?? undefined, to: stField.new ?? undefined })
      }
    }
    // Include creation as starting point with initial status if available from task
    if (task) {
      const createdAt = cleanActivities.find(a => a.action === 'task_created')?.created_at || task.created_at
      // Try to read initial status from created activity details
      let initialStatus: string = task.status
      const created = cleanActivities.find(a => a.action === 'task_created')
      const d = (created?.details as Record<string, unknown> | null) ?? null
      const stField = d && typeof d === 'object' ? (d as Record<string, unknown>)['status'] : undefined
      if (typeof stField === 'string') initialStatus = stField
      else if (stField && typeof stField === 'object') {
        const obj = stField as { old?: string; new?: string }
        if (typeof obj.new === 'string') initialStatus = obj.new
      }
      changes.unshift({ at: createdAt, to: initialStatus })
    }
    // sort by time
    changes.sort((a,b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    // accumulate durations until next change; last segment until now or task.updated_at
    const durations: Record<string, number> = {}
    for (let i = 0; i < changes.length; i++) {
      const current = changes[i]
      const next = changes[i+1]
      const statusKey = current.to || task?.status || 'unknown'
      const start = new Date(current.at).getTime()
      const end = next ? new Date(next.at).getTime() : Date.now()
      const delta = Math.max(0, Math.floor((end - start) / 1000))
      durations[statusKey] = (durations[statusKey] || 0) + delta
    }
    return durations
  }, [cleanActivities, task])

  const historySummary = React.useMemo(() => {
    if (!task) return null
    type Change = { at: string; from?: string | null; to?: string | null }
    const changes: Change[] = []
    for (const a of cleanActivities) {
      const detailsObj = a.details as Record<string, unknown> | null
      const stField = detailsObj && typeof detailsObj === 'object' ? (detailsObj.status as { old?: string; new?: string } | string | undefined) : undefined
      if (stField && typeof stField === 'object') {
        const obj = stField as { old?: string; new?: string }
        if (obj.old !== obj.new) {
          changes.push({ at: a.created_at, from: obj.old ?? undefined, to: obj.new ?? undefined })
        }
      }
    }
    const createdAt = cleanActivities.find(a => a.action === 'task_created')?.created_at || task.created_at
    const initialStatus = (() => {
      const created = cleanActivities.find(a => a.action === 'task_created')
      const d = (created?.details as Record<string, unknown> | null) ?? null
      const sf = d && typeof d === 'object' ? (d as Record<string, unknown>)['status'] : undefined
      if (typeof sf === 'string') return sf
      if (sf && typeof sf === 'object') {
        const obj = sf as { old?: string; new?: string }
        if (typeof obj.new === 'string') return obj.new
      }
      return task.status
    })()
    changes.sort((a,b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    const finished = changes.find(c => c.to === 'completed')
    const last = changes[changes.length - 1]
    return {
      startedAt: createdAt,
      startedStatus: initialStatus as string,
      finishedAt: finished ? finished.at : (last ? last.at : task.updated_at),
      finishedStatus: finished ? 'completed' : (last?.to || task.status),
    }
  }, [cleanActivities, task])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t('task.loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('task.notFoundTitle')}</h2>
          <p className="text-muted-foreground mb-4">
            {error || t('task.notFoundDesc')}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('task.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-3 md:px-6 md:py-4 space-y-6">
      <DashboardHeader
        title={task.title}
        backHref="/dashboard"
        breadcrumb={[
          { label: t('dashboard.breadcrumb.dashboard'), href: '/dashboard' },
          { label: task.project_title || 'Proje', href: task.project_id ? `/dashboard/projects/${task.project_id}` : undefined },
          { label: t('task.details.title') },
        ]}
        meta={(
          <p className="text-muted-foreground flex items-center gap-2 text-xs md:text-sm min-w-0">
            <span className="inline-flex items-center gap-1 whitespace-nowrap"><Folder className="h-3 w-3" aria-hidden="true" /> Proje:</span>
            <span className="truncate">{task.project_title || 'Bilinmeyen Proje'}</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline-flex items-center gap-1"><User className="h-3 w-3" aria-hidden="true" /> {(task.creator_name || task.creator_email || task.created_by)}</span>
          </p>
        )}
        actions={(
          <div className="hidden md:flex items-center gap-2">
            {getPriorityBadge(task.priority)}
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('task.edit')}
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ana İçerik */}
        <div className="xl:col-span-2 space-y-6">
          {/* Görev Detayları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(task.status)}
                {t('task.details.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <h3 className="font-medium mb-2">{t('task.details.description')}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">{t('task.details.status')}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span>{getStatusText(task.status)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">{t('task.details.priority')}</h3>
                  {getPriorityBadge(task.priority)}
                </div>
              </div>

              {task.due_date && (
                <div>
                  <h3 className="font-medium mb-2">{t('task.details.dueDate')}</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(task.due_date)}</span>
                    <Badge variant="outline" className={getDaysRemainingColor(task.due_date)}>
                      {getDaysRemaining(task.due_date)}
                    </Badge>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">{t('task.details.assignee')}</h3>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {task.assigned_to ? (
                      (() => {
                        const member = projectMembers.find(m => m.id === task.assigned_to);
                        return member ? (member.name || member.email || member.id) : (task.assigned_to);
                      })()
                    ) : (
                      t('task.details.unassigned')
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="w-full overflow-x-auto">
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('task.tabs.comments')}
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dosyalar
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Geçmiş
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="comments" className="mt-6">
              <Card>
                <CardHeader className="space-y-2">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <CardTitle>Yorumlar</CardTitle>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="relative flex-1">
                      <input
                        value={newComment}
                        onChange={(e) => handleCommentInput(e.target.value)}
                        placeholder="Yorum yaz... (@ ile kişi önerisi)"
                        className="border rounded px-2 py-1 text-sm w-full min-w-0 md:w-64"
                        onKeyDown={(e) => {
                          if (mentionOpen) {
                            if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((i) => Math.min(i + 1, Math.max(mentionCandidates.length - 1, 0))); return }
                            if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((i) => Math.max(i - 1, 0)); return }
                            if (e.key === 'Escape') { setMentionOpen(false); return }
                            if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); const c = mentionCandidates[mentionIndex]; if (c) insertMention(c); return }
                          }
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Emoji"
                          className="text-muted-foreground hover:text-foreground text-sm"
                          onClick={() => setShowEmoji((s) => !s)}
                        >😊</button>
                      </div>
                      {mentionOpen && mentionCandidates.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full max-w-[20rem] rounded-md border bg-popover text-popover-foreground shadow">
                          {mentionCandidates.map((c, idx) => (
                            <button
                              type="button"
                              key={c.id}
                              className={`w-full text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground ${idx === mentionIndex ? 'bg-accent/60' : ''}`}
                              onMouseDown={(e) => { e.preventDefault(); insertMention(c) }}
                            >
                              @{c.label} <span className="text-xs text-muted-foreground">{c.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {showEmoji && (
                        <div className="absolute z-20 mt-1 right-0 w-48 rounded-md border bg-popover text-popover-foreground shadow p-1 grid grid-cols-6 gap-1">
                          {['😀','😅','😂','🙂','😍','🤔','🙌','🔥','👍','👀','✅','❗️','🎉','❤️','🚀','🧠','💡','📝','📌','⏰'].map(ch => (
                            <button key={ch} type="button" className="p-1 hover:bg-accent rounded" onMouseDown={(e) => { e.preventDefault(); setNewComment((v) => v + ' ' + ch); setShowEmoji(false) }}>{ch}</button>
                          ))}
                        </div>
                      )}
                      </div>
                      <Button size="sm" className="md:inline-flex hidden" onClick={handleAddComment} disabled={commentLoading || !newComment.trim()}>
                        {commentLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Kaydediliyor
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('task.comments.add')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                {ogPreview && (
                  <div className="border rounded-md p-2 mb-3 flex gap-3">
                    {ogPreview.image && (
                      <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ogPreview.image} alt="" className="object-cover w-16 h-16" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <a href={ogPreview.url} target="_blank" rel="noreferrer" className="font-medium underline line-clamp-1 break-all">{ogPreview.title || ogPreview.url}</a>
                      {ogPreview.description && <p className="text-sm text-muted-foreground line-clamp-2">{ogPreview.description}</p>}
                      {ogPreview.siteName && <p className="text-xs text-muted-foreground mt-1">{ogPreview.siteName}</p>}
                    </div>
                  </div>
                )}
                  {/* Mobile add button under input */}
                  <div className="px-2 pb-2 md:hidden">
                    <Button size="sm" className="w-full" onClick={handleAddComment} disabled={commentLoading || !newComment.trim()}>
                      {commentLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Kaydediliyor
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {t('task.comments.add')}
                        </>
                      )}
                    </Button>
                  </div>
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('task.comments.empty')}</p>
                      <p className="text-sm">{t('task.comments.first')}</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {comments.map((c) => (
                        <li key={c.id} className="border rounded p-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{c.author_name || c.author_email || 'Kullanıcı'}</span>
                            <span>{new Date(c.created_at).toLocaleString('tr-TR')}</span>
                          </div>
                          <div className="mt-1 text-sm whitespace-pre-wrap break-words">{renderCommentText(c.content)}</div>
                          <div className="mt-2 text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteComment(c.id)}>Sil</Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="files" className="mt-6">
              <Card
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragActive(false)
                  if (!task) return
                  const fileList = Array.from(e.dataTransfer.files || [])
                  if (fileList.length === 0) return
                  setUploading(true)
                  try {
                    for (const f of fileList) {
                      const saved = await uploadTaskFile(task.id, f)
                      setFiles((prev) => [...prev, saved])
                    }
                  } catch {
                    toast.error('Dosya yüklenemedi')
                  } finally {
                    setUploading(false)
                  }
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                {t('task.tabs.files')}
                    <div>
                      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                        <input type="file" className="hidden" onChange={handleUpload} />
                        <Button size="sm" disabled={uploading}>
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yükleniyor
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" /> {t('task.files.add')}
                            </>
                          )}
                        </Button>
                      </label>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`mb-3 text-xs rounded border-dashed border p-3 ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'}`}>
                    Dosyaları buraya sürükleyip bırakın ya da butonla seçin
                  </div>
                  {files.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('task.files.empty')}</p>
                      <p className="text-sm">{t('task.files.first')}</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {files.map((f) => (
                        <li key={f.path} className="flex items-center justify-between border rounded p-2 text-sm">
                          <a href={f.url || '#'} target="_blank" rel="noreferrer" className="underline truncate max-w-[70%]">
                            {f.name}
                          </a>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(f.path)}>Sil</Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('task.history.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Brief summary */}
                  {historySummary && (
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="rounded border p-2">
                        <div className="text-muted-foreground">Başlangıç</div>
                        <div className="font-medium">{new Date(historySummary.startedAt).toLocaleString('tr-TR')}</div>
                        <div className="text-xs text-muted-foreground">{getStatusText(historySummary.startedStatus as Task['status'])}</div>
                      </div>
                      <div className="rounded border p-2">
                        <div className="text-muted-foreground">Bitiş</div>
                        <div className="font-medium">{new Date(historySummary.finishedAt).toLocaleString('tr-TR')}</div>
                        <div className="text-xs text-muted-foreground">{getStatusText(historySummary.finishedStatus as Task['status'])}</div>
                      </div>
                      <div className="rounded border p-2">
                        <div className="text-muted-foreground">Toplam Süre</div>
                        <div className="font-medium">
                          {(() => {
                            const start = new Date(historySummary.startedAt).getTime()
                            const end = new Date(historySummary.finishedAt).getTime()
                            return formatDuration(Math.max(0, Math.floor((end - start) / 1000)))
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Status durations summary */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Durumlarda Harcanan Süre</h4>
                    {Object.keys(computeStatusDurations).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Henüz durum geçişi yok</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(computeStatusDurations).map(([status, secs]) => (
                          <div key={status} className="flex items-center justify-between rounded border p-2 text-sm">
                            <span>{getStatusText(status as Task['status'])}</span>
                            <span className="text-muted-foreground">{formatDuration(secs)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Time logs */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Zaman Kayıtları</h4>
                    {timeLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Kayıt yok</p>
                    ) : (
                      <ul className="space-y-2">
                        {timeLogs.map(log => (
                          <li key={log.id} className="rounded border p-2 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-medium">{log.actor_name || log.actor_email || log.user_id}</span>
                                <span className="text-muted-foreground"> • {new Date(log.start_time).toLocaleString('tr-TR')}</span>
                                {log.end_time && (
                                  <span className="text-muted-foreground"> → {new Date(log.end_time).toLocaleString('tr-TR')}</span>
                                )}
                              </div>
                              <div className="text-muted-foreground whitespace-nowrap">{formatDuration(log.duration_seconds || 0)}</div>
                            </div>
                            {log.description && (
                              <div className="text-xs text-muted-foreground mt-1 break-words">{log.description}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Activity timeline */}
                  <div>
                    <h4 className="font-medium mb-2">Aktivite Geçmişi</h4>
                    {activities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{t('task.history.empty')}</p>
                        <p className="text-sm">{t('task.history.info')}</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {cleanActivities.map(a => {
                          const when = new Date(a.created_at).toLocaleString('tr-TR')
                          const who = a.actor_name || a.actor_email || a.user_id
                          let description: string = a.action
                          // Try to format known actions
                          if (a.action === 'task_created') description = 'Görev oluşturuldu'
                          if (a.action === 'task_updated') description = 'Görev güncellendi'
                          if (a.action === 'task_deleted') description = 'Görev silindi'
                          if (a.action === 'task_assigned') description = 'Görev atandı'
                          if (a.action === 'comment_added') description = 'Yorum eklendi'
                          // Status change pretty details
                          const det = a.details as Record<string, unknown> | null
                          const st = det && typeof det === 'object' ? (det.status as { old?: string; new?: string } | string | undefined) : undefined
                          return (
                            <li key={a.id} className="border rounded p-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{who}</span>
                                <span>{when}</span>
                              </div>
                              <div className="mt-1 text-sm">
                                <div className="font-medium">{description}</div>
                                {typeof st === 'object' && st && (
                                  <div className="text-xs mt-1">Durum: {getStatusText(st.old ?? 'todo')} → {getStatusText(st.new ?? 'todo')}</div>
                                )}
                                {/* Pretty-print other fields */}
                                {a.details && (
                                  (() => {
                                    const d = det || {}
                                    const entries = Object.entries(d).filter(([k]) => k !== 'status')
                                    if (entries.length === 0) return null
                                    return (
                                      <div className="mt-2 space-y-1">
                                        {entries.map(([k, v]) => {
                                          if (k === 'assigned_to') {
                                            return <div key={k} className="text-xs text-muted-foreground">Atanan: {getUserLabelById(String(v))}</div>
                                          }
                                          if (k === 'previous_assignee') {
                                            return <div key={k} className="text-xs text-muted-foreground">Önceki Atanan: {getUserLabelById(v as string | null)}</div>
                                          }
                                          if (k === 'due_date' && v && typeof v === 'object') {
                                            const obj = v as { old?: string | null; new?: string | null }
                                            return (
                                              <div key={k} className="text-xs text-muted-foreground">Bitiş Tarihi: {obj.old ? new Date(obj.old).toLocaleString('tr-TR') : '—'} → {obj.new ? new Date(obj.new).toLocaleString('tr-TR') : '—'}</div>
                                            )
                                          }
                                          // generic fallback
                                          return (
                                            <div key={k} className="text-xs text-muted-foreground break-words">
                                              {k}: {typeof v === 'string' ? v : JSON.stringify(v)}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )
                                  })()
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Yan Panel */}
        <div className="space-y-6">
          {/* Hızlı İşlemler */}
          <Card>
            <CardHeader>
              <CardTitle>{t('task.quick.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowAssignment(true)}
              >
                <User className="h-4 w-4 mr-2" />
                {t('task.quick.assign')}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                {t('task.quick.logTime')}
              </Button>
              <Button variant="outline" className="w-full justify-start hidden" />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  const nowIso = new Date().toISOString().slice(0,16)
                  setLogStart(nowIso)
                  setLogEnd('')
                  setLogDesc('')
                  setLogModalOpen(true)
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Çalışma Süresi Ekle
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      if (!task) return
                      const created = await startTimeLog(task.id)
                      setTimeLogs((prev) => [...prev, created])
                      toast.success('Zaman takibi başlatıldı')
                    } catch {
                      toast.error('Başlatılamadı')
                    }
                  }}
                >Başlat</Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      if (!task) return
                      const updated = await stopTimeLog(task.id)
                      if (updated) {
                        setTimeLogs((prev) => prev.map(x => x.id === updated.id ? updated : x))
                        toast.success('Zaman takibi durduruldu')
                      } else {
                        toast.error('Açık bir kayıt bulunamadı')
                      }
                    } catch {
                      toast.error('Durdurulamadı')
                    }
                  }}
                >Durdur</Button>
              </div>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('task.quick.addComment')}
              </Button>
            </CardContent>
          </Card>

          {/* Görev Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Görev Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground whitespace-nowrap">Oluşturan:</span>
                <span className="truncate text-right">{task.creator_name || task.creator_email || 'Bilinmiyor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oluşturulma:</span>
                <span>{task.created_at ? formatDate(task.created_at) : 'Bilinmiyor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Son Güncelleme:</span>
                <span>{task.updated_at ? formatDate(task.updated_at) : 'Bilinmiyor'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Düzenleme Modalı */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('task.edit')}</DialogTitle>
          </DialogHeader>
          {task && (
            <TaskEditForm
              task={task}
              projectId={task.project_id}
              onSaved={() => {
                setEditing(false);
                loadTask(); // Görevi yeniden yükle
              }}
              onCancel={() => setEditing(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Atama Modalı */}
      <Dialog open={showAssignment} onOpenChange={setShowAssignment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('task.quick.assign')}</DialogTitle>
          </DialogHeader>
          {task && (
            <TaskAssignment
              taskId={task.id}
              projectId={task.project_id}
              currentAssignee={task.assigned_to}
              onAssignmentChange={() => {
                setShowAssignment(false);
                handleAssignmentChange();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Zaman Kaydı Modalı */}
      <Dialog open={logModalOpen} onOpenChange={setLogModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Çalışma Süresi Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm">Başlangıç</label>
              <input
                type="datetime-local"
                className="border rounded px-2 py-1 text-sm w-full"
                value={logStart}
                onChange={(e) => setLogStart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Bitiş (opsiyonel)</label>
              <input
                type="datetime-local"
                className="border rounded px-2 py-1 text-sm w-full"
                value={logEnd}
                onChange={(e) => setLogEnd(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Açıklama (opsiyonel)</label>
              <textarea
                className="border rounded px-2 py-1 text-sm w-full"
                rows={3}
                value={logDesc}
                onChange={(e) => setLogDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLogModalOpen(false)}>Vazgeç</Button>
              <Button
                onClick={async () => {
                  if (!task || !logStart) return
                  try {
                    setLogSaving(true)
                    const startIso = new Date(logStart).toISOString()
                    const endIso = logEnd ? new Date(logEnd).toISOString() : undefined
                    const created = await addTimeLog(task.id, { start_time: startIso, end_time: endIso, description: logDesc || undefined })
                    setTimeLogs((prev) => [...prev, created])
                    setLogModalOpen(false)
                  } catch {
                    toast.error('Zaman kaydı eklenemedi')
                  } finally {
                    setLogSaving(false)
                  }
                }}
                disabled={logSaving || !logStart}
              >
                {logSaving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Kaydediliyor</>) : 'Kaydet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
