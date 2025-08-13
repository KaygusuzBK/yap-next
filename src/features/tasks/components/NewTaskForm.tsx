"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTask, fetchProjectStatuses, type ProjectTaskStatus } from '../api';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/components/auth/AuthProvider';

interface NewTaskFormProps {
  projectId: string;
  onCreated?: () => void;
  onCancel?: () => void;
  defaultSlackWebhookUrl?: string;
}

export default function NewTaskForm({ projectId, onCreated, onCancel, defaultSlackWebhookUrl }: NewTaskFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<string>('todo');
  const [dueDate, setDueDate] = useState<string>('');
  const [openCal, setOpenCal] = useState(false)
  const [loading, setLoading] = useState(false);
  const [notifySlack, setNotifySlack] = useState(true);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [statuses, setStatuses] = useState<ProjectTaskStatus[] | null>(null)

  // Load/save temporary preferences from localStorage (per-user if available)
  useEffect(() => {
    // Load project statuses
    fetchProjectStatuses(projectId)
      .then((rows) => {
        setStatuses(rows)
        // Pick default of 'todo' group for new task
        const def = rows.find(r => r.group === 'todo' && r.is_default) || rows.find(r => r.group === 'todo')
        if (def) setStatus(def.key)
      })
      .catch(() => setStatuses([]))
  }, [projectId])

  useEffect(() => {
    try {
      const key = `prefs:${user?.id || 'anon'}:slack`;
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as { notify?: boolean; webhook?: string };
        if (typeof saved.notify === 'boolean') setNotifySlack(saved.notify);
        if (typeof saved.webhook === 'string') setSlackWebhookUrl(saved.webhook);
      } else if (defaultSlackWebhookUrl) {
        setSlackWebhookUrl(defaultSlackWebhookUrl);
      }
    } catch {}
  }, [user?.id, defaultSlackWebhookUrl]);

  useEffect(() => {
    try {
      const key = `prefs:${user?.id || 'anon'}:slack`;
      const payload = JSON.stringify({ notify: notifySlack, webhook: slackWebhookUrl });
      window.localStorage.setItem(key, payload);
    } catch {}
  }, [notifySlack, slackWebhookUrl, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Görev başlığı gereklidir');
      return;
    }

    try {
      setLoading(true);
      await createTask({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
        notifySlack,
        slackWebhookUrl: slackWebhookUrl.trim() || undefined,
      });
      
      toast.success('Görev başarıyla oluşturuldu');
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueDate('');
      onCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Görev oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Görev Başlığı *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Görev başlığını girin"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Görev açıklamasını girin (opsiyonel)"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Öncelik</Label>
          <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setPriority(value)}>
            <SelectTrigger disabled={loading}>
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

        <div className="space-y-2">
          <Label htmlFor="status">Durum</Label>
          <Select value={status} onValueChange={(value: string) => setStatus(value)}>
            <SelectTrigger disabled={loading}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses && statuses.length > 0 ? (
                statuses.sort((a,b) => a.position - b.position).map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="todo">Yapılacak</SelectItem>
                  <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                  <SelectItem value="review">İncelemede</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bitiş Tarihi</Label>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setOpenCal((v) => !v)} disabled={loading}>
            Tarih Seç
          </Button>
          <span className="text-sm text-muted-foreground">{dueDate ? new Date(dueDate).toLocaleString('tr-TR') : '—'}</span>
        </div>
        {openCal && (
          <div className="p-2 border rounded-md">
            <Calendar
              mode="single"
              selected={dueDate ? new Date(dueDate) : undefined}
              onSelect={(d) => {
                if (d) {
                  const iso = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16)
                  setDueDate(iso)
                }
                setOpenCal(false)
              }}
            />
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Slack’e mesaj yolla</div>
            <div className="text-xs text-muted-foreground">Görev oluşturulunca Slack kanalına bildirim gönder.</div>
          </div>
          <Switch id="notifySlack" checked={notifySlack} onCheckedChange={setNotifySlack} />
        </div>
        {notifySlack && (
          <div className="space-y-1">
            <Label htmlFor="slackWebhook">Slack Webhook URL (opsiyonel)</Label>
            <Input id="slackWebhook" placeholder="https://hooks.slack.com/services/..." value={slackWebhookUrl} onChange={(e) => setSlackWebhookUrl(e.target.value)} />
            <div className="text-[10px] text-muted-foreground">Boş bırakırsan varsayılan kanal kullanılır.</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-4">
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Oluşturuluyor...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Görev Oluştur
            </>
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            İptal
          </Button>
        )}
      </div>
    </form>
  );
}
