"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTask, fetchProjectStatuses, type ProjectTaskStatus } from '../api';
import { toast } from 'sonner';
import { Plus, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  FormField, 
  FormSection, 
  FormButtonGroup, 
  FormValidationMessage,
  FormHelp,
  AdvancedInput
} from '@/components/ui/form-components';

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
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifySlack, setNotifySlack] = useState(true);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [statuses, setStatuses] = useState<ProjectTaskStatus[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Görev başlığı gereklidir';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Görev başlığı en az 3 karakter olmalıdır';
    }
    
    if (dueDate && new Date(dueDate) < new Date()) {
      newErrors.dueDate = 'Bitiş tarihi geçmiş bir tarih olamaz';
    }
    
    if (notifySlack && slackWebhookUrl && !slackWebhookUrl.includes('hooks.slack.com')) {
      newErrors.slackWebhook = 'Geçerli bir Slack webhook URL\'si girin';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
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
      setErrors({});
      onCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Görev oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection 
        title="Görev Bilgileri" 
        description="Görevle ilgili temel bilgileri girin"
      >
        <FormField
          label="Görev Başlığı"
          required
          error={errors.title}
          hint="Görev başlığı en az 3 karakter olmalıdır"
        >
          <AdvancedInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Görev başlığını girin"
            disabled={loading}
            icon={<AlertCircle className="h-4 w-4" />}
          />
        </FormField>

        <FormField
          label="Açıklama"
          hint="Görev hakkında detaylı bilgi verebilirsiniz"
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Görev açıklamasını girin (opsiyonel)"
            rows={3}
            disabled={loading}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Öncelik"
            hint="Görevin önem seviyesi"
          >
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
          </FormField>

          <FormField
            label="Durum"
            hint="Görevin mevcut durumu"
          >
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
          </FormField>
        </div>

        <FormField
          label="Bitiş Tarihi"
          error={errors.dueDate}
          hint="Görevin tamamlanması gereken tarih"
        >
          <AdvancedInput
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={loading}
            icon={<Calendar className="h-4 w-4" />}
          />
        </FormField>
      </FormSection>

      <FormSection 
        title="Bildirim Ayarları" 
        description="Görev oluşturulduğunda Slack'e bildirim gönder"
      >
        <div className="space-y-3 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Slack'e mesaj yolla</div>
              <div className="text-xs text-muted-foreground">Görev oluşturulunca Slack kanalına bildirim gönder.</div>
            </div>
            <Switch id="notifySlack" checked={notifySlack} onCheckedChange={setNotifySlack} />
          </div>
          {notifySlack && (
            <FormField
              label="Slack Webhook URL"
              error={errors.slackWebhook}
              hint="Boş bırakırsan varsayılan kanal kullanılır"
            >
              <AdvancedInput
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
              />
            </FormField>
          )}
        </div>
      </FormSection>

      <FormButtonGroup
        primaryAction={{
          label: loading ? "Oluşturuluyor..." : "Görev Oluştur",
          onClick: handleSubmit,
          loading,
          disabled: loading || !title.trim()
        }}
        cancelAction={onCancel ? {
          label: "İptal",
          onClick: onCancel
        } : undefined}
      />
    </form>
  );
}
