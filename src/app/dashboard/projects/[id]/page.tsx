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
import { useI18n } from '@/i18n/I18nProvider';

export default function ProjectDetailPage() {
  const { t, locale } = useI18n();
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
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');

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
        setSlackWebhookUrl(projectData.slack_webhook_url ?? '');
      } else {
        setError(t('project.notFound'));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t('project.loadError'));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

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
        status,
        slack_webhook_url: slackWebhookUrl.trim() || null,
      });
      
      setProject(updatedProject);
      setEditing(false);
      toast.success(t('project.updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('project.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    try {
      setDeleting(true);
      await deleteProject(project.id);
      toast.success(t('project.deleted'));
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('project.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" />{t('project.status.active')}</Badge>;
      case 'archived':
        return <Badge variant="secondary" className="flex items-center gap-1"><Archive className="h-3 w-3" />{t('project.status.archived')}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />{t('project.status.completed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">{t('project.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t('project.notFound')}</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('project.backToDashboard')}
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
                <BreadcrumbLink href="/dashboard">{t('dashboard.breadcrumb.dashboard')}</BreadcrumbLink>
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
                  {saving ? t('common.saving') : t('common.save')}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('project.deleteTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('project.deleteConfirm',).replace('{title}', project.title)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleting ? t('common.deleting') : t('common.delete')}
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
              <CardTitle>{t('project.details.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('project.details.fields.title')}</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('project.details.placeholders.title')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('project.details.fields.description')}</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('project.details.placeholders.description')}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team">{t('project.details.fields.team')}</Label>
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('project.details.placeholders.team')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">{t('project.details.personalProject')}</SelectItem>
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
                    <Label>Slack Webhook URL</Label>
                    <Input value={slackWebhookUrl} onChange={(e) => setSlackWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('project.details.fields.status')}</Label>
                    <Select value={status} onValueChange={(value: 'active' | 'archived' | 'completed') => setStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('project.status.active')}</SelectItem>
                        <SelectItem value="archived">{t('project.status.archived')}</SelectItem>
                        <SelectItem value="completed">{t('project.status.completed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium">{t('project.details.fields.title')}</Label>
                    <p className="text-sm text-muted-foreground mt-1">{project.title}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">{t('project.details.fields.description')}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description || t('project.details.emptyDescription')}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">{t('project.details.fields.team')}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.team_id ? 
                        teams.find(t => t.id === project.team_id)?.name || t('project.details.unknownTeam') : 
                        t('project.details.personalProject')
                      }
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Slack Webhook URL</Label>
                    <p className="text-sm text-muted-foreground mt-1 break-all">
                      {project.slack_webhook_url || '-'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">{t('project.details.fields.status')}</Label>
                    <div className="mt-1">
                      {getStatusBadge(project.status)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">{t('project.details.createdAt')}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(project.created_at)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">{t('project.details.updatedAt')}</Label>
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
              <CardTitle>{t('project.stats.title')}</CardTitle>
              <CardDescription>{t('project.stats.desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('project.stats.projectType')}</span>
                  <div className="flex items-center gap-1">
                    {project.team_id ? (
                      <>
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t('project.stats.teamProject')}</span>
                      </>
                    ) : (
                      <>
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t('project.details.personalProject')}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('project.details.fields.status')}</span>
                  {getStatusBadge(project.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('project.stats.created')}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('project.stats.updated')}</span>
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
              <CardTitle className="text-lg">{t('project.tasks.createTitle')}</CardTitle>
              <CardDescription>{t('project.tasks.createDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                  <NewTaskForm
                    projectId={projectId}
                    defaultSlackWebhookUrl={project.slack_webhook_url || undefined}
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
                  <div className="text-muted-foreground mb-2">{t('common.soon')}</div>
                  <Button variant="outline" disabled>
                    {t('project.files.upload')}
                  </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('project.comments.title')}</CardTitle>
              <CardDescription>{t('project.comments.desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-2">{t('common.soon')}</div>
                  <Button variant="outline" disabled>
                    {t('project.comments.add')}
                  </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
