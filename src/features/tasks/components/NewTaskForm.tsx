"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTask } from '../api';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface NewTaskFormProps {
  projectId: string;
  onCreated?: () => void;
  onCancel?: () => void;
}

export default function NewTaskForm({ projectId, onCreated, onCancel }: NewTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'review' | 'completed'>('todo');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifySlack, setNotifySlack] = useState(true);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');

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
          <Select value={status} onValueChange={(value: 'todo' | 'in_progress' | 'review' | 'completed') => setStatus(value)}>
            <SelectTrigger disabled={loading}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">Yapılacak</SelectItem>
              <SelectItem value="in_progress">Devam Ediyor</SelectItem>
              <SelectItem value="review">İncelemede</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Bitiş Tarihi</Label>
        <Input
          id="dueDate"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={loading}
        />
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
