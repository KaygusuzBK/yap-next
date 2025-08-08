"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProjectById, updateProject, deleteProject, type Project } from '../../../../features/projects/api';
import { fetchTeams, type Team } from '../../../../features/teams/api';
import TaskList from '../../../../features/tasks/components/TaskList';
import NewTaskForm from '../../../../features/tasks/components/NewTaskForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '../../../../components/ui/alert-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../../components/ui/breadcrumb';
import { 
  Edit, 
  Save, 
  X, 
  Trash2, 
  ArrowLeft, 
  Calendar, 
  Users, 
  Folder,
  Archive,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('personal');
  const [status, setStatus] = useState<'active' | 'archived' | 'completed'>('active');

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const projectData = await getProjectById(projectId);
      if (projectData) {
        setProject(projectData);
        setTitle(projectData.title);
        setDescription(projectData.description || '');
        setSelectedTeamId(projectData.team_id || 'personal');
        setStatus(projectData.status);
      } else {
        setError('Proje bulunamadı');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Proje yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadTeams = useCallback(async () => {
    try {
      const teamsData = await fetchTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Takımlar yüklenirken hata:', error);
    }
  }, []);

  useEffect(() => {
    loadProject();
    loadTeams();
  }, [loadProject, loadTeams]);

  const handleSave = async () => {
    if (!project) return;

    try {
      setSaving(true);
      const updatedProject = await updateProject({
        id: project.id,
        title: title.trim(),
        description: description.trim() || null,
        team_id: selectedTeamId === 'personal' ? null : selectedTeamId,
        status
      });
      
      setProject(updatedProject);
      setEditing(false);
      toast.success('Proje başarıyla güncellendi');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Proje güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    try {
      setDeleting(true);
      await deleteProject(project.id);
      toast.success('Proje başarıyla silindi');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Proje silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" />Aktif</Badge>;
      case 'archived':
        return <Badge variant="secondary" className="flex items-center gap-1"><Archive className="h-3 w-3" />Arşivlenmiş</Badge>;
      case 'completed':
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Tamamlandı</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Proje yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Proje bulunamadı'}</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard&apos;a Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-2 gap-4">
      <div className="w-full space-y-4">
        {/* Breadcrumb */}
        <section>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{project.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </section>

        {/* Header */}
        <section className="flex items-center justify-between">
          <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(project.status)}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(project.created_at)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Projeyi Sil</AlertDialogTitle>
                      <AlertDialogDescription>
                        &quot;{project.title}&quot; projesini silmek istediğinizden emin misiniz? 
                        Bu işlem geri alınamaz ve projeye ait tüm veriler silinecektir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleting ? 'Siliniyor...' : 'Sil'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </section>

        {/* Project Details */}
        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Proje Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">Proje Başlığı</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Proje başlığını girin"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Proje açıklamasını girin"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team">Takım</Label>
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Takım seçin (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Kişisel Proje</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {team.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Durum</Label>
                    <Select value={status} onValueChange={(value: 'active' | 'archived' | 'completed') => setStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="archived">Arşivlenmiş</SelectItem>
                        <SelectItem value="completed">Tamamlandı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium">Başlık</Label>
                    <p className="text-sm text-muted-foreground mt-1">{project.title}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Açıklama</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description || 'Açıklama yok'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Takım</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.team_id ? 
                        teams.find(t => t.id === project.team_id)?.name || 'Bilinmeyen takım' : 
                        'Kişisel proje'
                      }
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Durum</Label>
                    <div className="mt-1">
                      {getStatusBadge(project.status)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Oluşturulma Tarihi</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(project.created_at)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Son Güncelleme</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(project.updated_at)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proje İstatistikleri</CardTitle>
              <CardDescription>Proje hakkında genel bilgiler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Proje Tipi</span>
                  <div className="flex items-center gap-1">
                    {project.team_id ? (
                      <>
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Takım Projesi</span>
                      </>
                    ) : (
                      <>
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Kişisel Proje</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Durum</span>
                  {getStatusBadge(project.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Oluşturulma</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Son Güncelleme</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(project.updated_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Görevler Bölümü */}
        <section>
          {showTaskForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yeni Görev Oluştur</CardTitle>
                <CardDescription>Proje için yeni bir görev ekleyin</CardDescription>
              </CardHeader>
              <CardContent>
                <NewTaskForm
                  projectId={projectId}
                  onCreated={() => {
                    setShowTaskForm(false);
                    // Görev listesini yenilemek için key değiştir
                    setProject({ ...project! });
                  }}
                  onCancel={() => setShowTaskForm(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <TaskList
              projectId={projectId}
              onCreateNew={() => setShowTaskForm(true)}
            />
          )}
        </section>

        {/* Diğer Özellikler */}
        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dosyalar</CardTitle>
              <CardDescription>Proje dosyalarını yönetin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">Yakında</div>
                <Button variant="outline" disabled>
                  Dosya Yükle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Yorumlar</CardTitle>
              <CardDescription>Proje yorumlarını görüntüleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">Yakında</div>
                <Button variant="outline" disabled>
                  Yorum Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
