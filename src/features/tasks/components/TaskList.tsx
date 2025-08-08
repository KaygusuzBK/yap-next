"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchTasksByProject, type Task } from '../api';
import { Plus, Clock, CheckCircle, AlertCircle, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

interface TaskListProps {
  projectId: string;
  onCreateNew?: () => void;
}

export default function TaskList({ projectId, onCreateNew }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
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
  };

  useEffect(() => {
    loadTasks();
  }, [projectId]);

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
    const todo = tasks.filter(t => t.status === 'todo').length;
    const review = tasks.filter(t => t.status === 'review').length;

    return { total, completed, inProgress, todo, review };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Görevler
          </CardTitle>
          <CardDescription>Proje görevlerini yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Görevler yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Görevler
          </CardTitle>
          <CardDescription>Proje görevlerini yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadTasks} variant="outline">
              Tekrar Dene
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Görevler
            </CardTitle>
            <CardDescription>Proje görevlerini yönetin</CardDescription>
          </div>
          <Button onClick={onCreateNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Görev Ekle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* İstatistikler */}
        <div className="grid grid-cols-5 gap-4 mb-6">
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

        {/* Görev Listesi */}
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">Henüz görev yok</div>
            <Button onClick={onCreateNew} variant="outline">
              İlk Görevi Oluştur
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getStatusText(task.status)}
                        </div>
                        {getPriorityBadge(task.priority)}
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.due_date)}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {task.assigned_to ? 'Atanmış' : 'Atanmamış'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    Düzenle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
