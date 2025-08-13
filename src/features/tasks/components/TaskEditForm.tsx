"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateTask, type Task, fetchProjectStatuses, type ProjectTaskStatus } from '../api';
import { toast } from 'sonner';
import { Save, Loader2, X } from 'lucide-react';
import TaskAssignment from './TaskAssignment';

interface TaskEditFormProps {
  task: Task;
  projectId: string;
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function TaskEditForm({ task, projectId, onSaved, onCancel }: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(task.priority);
  const [status, setStatus] = useState<string>(task.status);
  const [dueDate, setDueDate] = useState<string>(task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '');
  const [openCal, setOpenCal] = useState(false)
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<ProjectTaskStatus[] | null>(null)

  // Load project-specific statuses
  useEffect(() => {
    fetchProjectStatuses(projectId)
      .then(setStatuses)
      .catch(() => setStatuses([]))
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Görev başlığı gereklidir');
      return;
    }

    try {
      setLoading(true);
      await updateTask({
        id: task.id,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
      });
      
      toast.success('Görev başarıyla güncellendi');
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Görev güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = () => {
    onSaved?.();
  };

  return (
    <div className="space-y-6">
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

        <div className="flex items-center gap-2 pt-4">
          <Button type="submit" disabled={loading || !title.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
          )}
        </div>
      </form>

      <div className="border-t pt-6">
        <TaskAssignment
          taskId={task.id}
          projectId={projectId}
          currentAssignee={task.assigned_to}
          onAssignmentChange={handleAssignmentChange}
        />
      </div>
    </div>
  );
}
