"use client";

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
  Loader2
} from 'lucide-react';
import { fetchTaskById, getProjectMembers, type Task } from '../../../../features/tasks/api';
import { toast } from 'sonner';
import TaskEditForm from '../../../../features/tasks/components/TaskEditForm';
import TaskAssignment from '../../../../features/tasks/components/TaskAssignment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [projectMembers, setProjectMembers] = useState<Array<{ id: string; email: string; name?: string }>>([]);

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
      } catch (memberError) {
        console.error('Proje üyeleri yüklenirken hata:', memberError);
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
    }
  }, [taskId, loadTask]);

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

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return 'Yapılacak';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'review':
        return 'İncelemede';
      case 'completed':
        return 'Tamamlandı';
      default:
        return status;
    }
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
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} gün gecikmiş`;
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return '1 gün kaldı';
    return `${diffDays} gün kaldı`;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Görev yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Görev Bulunamadı</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'Aradığınız görev mevcut değil veya erişim izniniz yok.'}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <p className="text-muted-foreground">
            Proje: {task.project_title || 'Bilinmeyen Proje'}
          </p>
        </div>
        <Button onClick={() => setEditing(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Düzenle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ana İçerik */}
        <div className="lg:col-span-2 space-y-6">
          {/* Görev Detayları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(task.status)}
                Görev Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <h3 className="font-medium mb-2">Açıklama</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Durum</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span>{getStatusText(task.status)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Öncelik</h3>
                  {getPriorityBadge(task.priority)}
                </div>
              </div>

              {task.due_date && (
                <div>
                  <h3 className="font-medium mb-2">Bitiş Tarihi</h3>
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
                <h3 className="font-medium mb-2">Atanan Kişi</h3>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {task.assigned_to ? (
                      (() => {
                        const member = projectMembers.find(m => m.id === task.assigned_to);
                        return member ? member.name || member.email : 'Bilinmeyen kullanıcı';
                      })()
                    ) : (
                      'Atanmamış'
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Yorumlar
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
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Yorumlar
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Yorum Ekle
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz yorum yok</p>
                    <p className="text-sm">İlk yorumu siz ekleyin!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="files" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Dosyalar
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Dosya Ekle
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz dosya yok</p>
                    <p className="text-sm">İlk dosyayı siz ekleyin!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Görev Geçmişi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz aktivite yok</p>
                    <p className="text-sm">Görev üzerinde değişiklik yapıldığında burada görünecek</p>
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
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowAssignment(true)}
              >
                <User className="h-4 w-4 mr-2" />
                Kişi Ata
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Zaman Kaydet
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Yorum Ekle
              </Button>
            </CardContent>
          </Card>

          {/* Görev Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Görev Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oluşturan:</span>
                <span>{task.created_by || 'Bilinmiyor'}</span>
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
            <DialogTitle>Görevi Düzenle</DialogTitle>
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
            <DialogTitle>Görev Ataması</DialogTitle>
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
    </div>
  );
}
