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
import { fetchTaskById, getProjectMembers, fetchComments, addComment, deleteComment, type Task, type TaskComment } from '../../../../features/tasks/api';
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
  const [commentLoading, setCommentLoading] = useState(false);

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
    }
  }, [taskId, loadTask]);

  const handleAddComment = async () => {
    const content = newComment.trim();
    if (!content || !task) return;
    try {
      setCommentLoading(true);
      const created = await addComment(task.id, content);
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (e) {
      toast.error('Yorum eklenemedi');
    } finally {
      setCommentLoading(false);
    }
  };

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

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return t('taskStatus.todo') || 'Todo';
      case 'in_progress':
        return t('taskStatus.in_progress') || 'In Progress';
      case 'review':
        return t('taskStatus.review') || 'Review';
      case 'completed':
        return t('taskStatus.completed') || 'Completed';
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
    const loc = locale === 'tr' ? 'tr-TR' : 'en-US'
    return new Date(dateString).toLocaleDateString(loc, {
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
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('task.back')}
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
          {t('task.back')}
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <p className="text-muted-foreground">
            {`Proje: ${task.project_title || 'Bilinmeyen Proje'}`}
          </p>
        </div>
        <Button onClick={() => setEditing(true)}>
          <Edit className="h-4 w-4 mr-2" />
          {t('task.edit')}
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
                        return member ? member.name || member.email : t('task.details.unknownUser');
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
            <TabsList className="grid w-full grid-cols-3">
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
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Yorumlar
                    <div className="flex items-center gap-2">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Yorum yaz..."
                        className="border rounded px-2 py-1 text-sm w-64"
                      />
                      <Button size="sm" onClick={handleAddComment} disabled={commentLoading || !newComment.trim()}>
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
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                          <div className="mt-1 text-sm whitespace-pre-wrap">{c.content}</div>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                {t('task.tabs.files')}
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('task.files.add')}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('task.files.empty')}</p>
                    <p className="text-sm">{t('task.files.first')}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('task.history.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('task.history.empty')}</p>
                    <p className="text-sm">{t('task.history.info')}</p>
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
    </div>
  );
}
