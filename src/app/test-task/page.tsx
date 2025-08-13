"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Calendar } from '@/components/ui/calendar'
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { createTask } from '../../features/tasks/api';
import { toast } from 'sonner';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TestTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'review' | 'completed'>('todo');
  const [dueDate, setDueDate] = useState<string>('');
  const [openCal, setOpenCal] = useState(false)
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Görev başlığı gereklidir');
      return;
    }

    if (!projectId.trim()) {
      toast.error('Proje ID gereklidir');
      return;
    }

    try {
      setLoading(true);
      const task = await createTask({
        project_id: projectId.trim(),
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
      });
      
      toast.success(`Görev başarıyla oluşturuldu! ID: ${task.id}`);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueDate('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Görev oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col p-4 gap-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Görev Oluşturma Testi</h1>
      </div>

      <Card className="max-w-2xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Yeni Görev Oluştur</CardTitle>
          <CardDescription>Görev oluşturma işlemini test edin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Proje ID *</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Proje ID'sini girin (UUID formatında)"
                disabled={loading}
              />
            </div>

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
              <Button type="submit" disabled={loading || !title.trim() || !projectId.trim()}>
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
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
                Dashboard&apos;a Dön
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Test Talimatları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Önce bir proje oluşturun ve proje ID&apos;sini kopyalayın</p>
          <p>2. Proje ID&apos;sini yukarıdaki forma yapıştırın</p>
          <p>3. Görev bilgilerini doldurun</p>
          <p>4. &quot;Görev Oluştur&quot; butonuna tıklayın</p>
          <p>5. Başarılı olursa görev ID&apos;si gösterilecek</p>
        </CardContent>
      </Card>
    </main>
  );
}
