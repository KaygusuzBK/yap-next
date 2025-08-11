"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchTasksByProject, deleteTask, type Task } from '../api';
import { Plus, Clock, CheckCircle, AlertCircle, Calendar, User, Edit, MoreVertical, Filter } from 'lucide-react';
import { toast } from 'sonner';
import TaskEditForm from './TaskEditForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TaskListProps {
  projectId: string;
  onCreateNew?: () => void;
}

type FilterStatus = 'all' | 'todo' | 'in_progress' | 'review' | 'completed';

export default function TaskList({ projectId, onCreateNew }: TaskListProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await fetchTasksByProject(projectId);
      setTasks(tasksData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Görevler yüklenirken bir hata oluştu');
      toast.error('Görevler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTasks();
  }, [projectId, loadTasks]);

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    
    try {
      await deleteTask(deletingTask.id);
      toast.success('Görev başarıyla silindi');
      setDeletingTask(null);
      loadTasks(); // Listeyi yenile
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Görev silinirken bir hata oluştu');
    }
  };

  const handleTaskSaved = () => {
    setEditingTask(null);
    loadTasks(); // Listeyi yenile
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'review':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4" />;
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const review = tasks.filter(t => t.status === 'review').length;
    const todo = tasks.filter(t => t.status === 'todo').length;

    return { total, completed, inProgress, review, todo };
  };

  // Filtrelenmiş görevleri hesapla
  const filteredTasks = tasks.filter(task => {
    // Durum filtresi
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    
    // Tamamlanmış görevleri gizle/göster
    if (!showCompleted && task.status === 'completed') {
      return false;
    }
    
    return true;
  });

  // Görevleri sırala: tamamlanmamış görevler üstte, tamamlanmış görevler altta
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return 0;
  });

  const stats = getTaskStats();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Görevler</CardTitle>
              <CardDescription>
                Proje görevlerini yönetin ve takip edin
              </CardDescription>
            </div>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Görev
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* İstatistikler */}
          <div className="grid grid-cols-5 gap-4 mb-6 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Toplam</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Tamamlandı</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground">Devam Ediyor</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.review}</div>
              <div className="text-xs text-muted-foreground">İncelemede</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.todo}</div>
              <div className="text-xs text-muted-foreground">Yapılacak</div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="flex items-center gap-4 mb-6 p-4 border rounded-lg bg-background">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtreler:</span>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: FilterStatus) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="todo">Yapılacak</SelectItem>
                <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                <SelectItem value="review">İncelemede</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showCompleted"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showCompleted" className="text-sm">
                Tamamlanmış görevleri göster
              </label>
            </div>

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredTasks.length} görev gösteriliyor
            </div>
          </div>

          {/* Görev Listesi */}
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-3">
                {tasks.length === 0 ? 'Henüz görev yok' : 'Filtrelere uygun görev bulunamadı'}
              </div>
              <Button onClick={onCreateNew} variant="outline">
                {tasks.length === 0 ? 'İlk Görevi Oluştur' : 'Yeni Görev Oluştur'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                    task.status === 'completed' 
                      ? 'opacity-60 bg-muted/30 border-dashed' 
                      : 'bg-background'
                  }`}
                  onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(task.status)}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`text-sm mt-1 line-clamp-2 ${
                            task.status === 'completed' ? 'text-muted-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <div className={`flex items-center gap-1 text-xs ${
                            task.status === 'completed' ? 'text-muted-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {getStatusText(task.status)}
                          </div>
                          {getPriorityBadge(task.priority)}
                          {task.due_date && (
                            <div className={`flex items-center gap-1 text-xs ${
                              task.status === 'completed' ? 'text-muted-foreground/70' : 'text-muted-foreground'
                            }`}>
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.due_date)}
                            </div>
                          )}
                          <div className={`flex items-center gap-1 text-xs ${
                            task.status === 'completed' ? 'text-muted-foreground/70' : 'text-muted-foreground'
                          }`}>
                            <User className="h-3 w-3" />
                            {task.assigned_to ? 'Atanmış' : 'Atanmamış'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTask(task)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setDeletingTask(task)}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Düzenleme Modalı */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Görevi Düzenle</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskEditForm
              task={editingTask}
              projectId={projectId}
              onSaved={handleTaskSaved}
              onCancel={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Silme Onay Modalı */}
      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Görevi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deletingTask?.title}&quot; görevini silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz ve görevle ilgili tüm veriler (yorumlar, dosyalar, zaman kayıtları) silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
