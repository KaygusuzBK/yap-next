'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle, 
  Activity,
  Plus,
  Filter,
  User,
  Mail,
  Calendar,
  Shield,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { DashboardStats, Project, Task } from '@/lib/types';
import { projectService } from '@/lib/services/projects/api';
import { taskService } from '@/lib/services/tasks/api';
import { useAuthStore } from '@/lib/services/auth/store';
import { ProjectCard, TaskCard, StatsCard, LoadingSpinner, EmptyState } from '@/components';
import { ROLE_LABELS, USER_ROLES } from '@/constants';
import { formatDate, getUserInitials } from '@/utils/format';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuthStore();

  const loadDashboardData = async () => {
    try {
      setError(null);
      setRefreshing(true);
      
      const [projectsResponse, tasksResponse] = await Promise.all([
        projectService.getAllProjects(),
        taskService.getAllTasks()
      ]);

      // Calculate stats from data
      const calculatedStats: DashboardStats = {
        totalProjects: projectsResponse.length,
        activeProjects: projectsResponse.filter(p => p.status === 'active').length,
        completedProjects: projectsResponse.filter(p => p.status === 'completed').length,
        totalTasks: tasksResponse.length,
        completedTasks: tasksResponse.filter(t => t.status === 'completed').length,
        overdueTasks: tasksResponse.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date() && t.status !== 'completed';
        }).length,
        teamMembers: 1, // For now, just the current user
        totalHours: tasksResponse.reduce((sum, task) => sum + (task.actualHours || 0), 0),
      };

      setStats(calculatedStats);
      setRecentProjects(projectsResponse.filter(p => p.status === 'active').slice(0, 5));
      setRecentTasks(tasksResponse.filter(t => t.status === 'in_progress').slice(0, 5));
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    loadDashboardData();
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Proje yönetimi genel bakış</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtrele
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Proje
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* User Profile Section */}
        {user && (
          <div className="mb-8">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <User className="w-6 h-6" />
                  <span>Kullanıcı Profili</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="text-lg font-semibold">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Ad Soyad:</span>
                          <span className="text-muted-foreground">{user.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">E-posta:</span>
                          <span className="text-muted-foreground">{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Rol:</span>
                          <Badge variant={user.role === USER_ROLES.ADMIN ? 'destructive' : user.role === USER_ROLES.MANAGER ? 'default' : 'secondary'}>
                            {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Kayıt Tarihi:</span>
                          <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Son Güncelleme:</span>
                          <span className="text-muted-foreground">{formatDate(user.updatedAt)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Durum:</span>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Profili Düzenle
                      </Button>
                      <Button variant="outline" size="sm">
                        <Shield className="w-4 h-4 mr-2" />
                        Şifre Değiştir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Toplam Proje"
            value={stats?.totalProjects || 0}
            description={`${stats?.activeProjects || 0} aktif proje`}
            icon={BarChart3}
          />
          <StatsCard
            title="Toplam Görev"
            value={stats?.totalTasks || 0}
            description={`${stats?.completedTasks || 0} tamamlanan görev`}
            icon={CheckCircle}
          />
          <StatsCard
            title="Takım Üyeleri"
            value={stats?.teamMembers || 0}
            description="Aktif ekip üyeleri"
            icon={Users}
          />
          <StatsCard
            title="Toplam Saat"
            value={stats?.totalHours || 0}
            description="Harcanan toplam saat"
            icon={Clock}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="projects">Projeler</TabsTrigger>
            <TabsTrigger value="tasks">Görevler</TabsTrigger>
            <TabsTrigger value="activity">Aktivite</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Projects */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Son Projeler</h2>
                <Link href="/dashboard/projects">
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              </div>
              {recentProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="Henüz proje bulunmuyor"
                  description="İlk projenizi oluşturarak başlayın"
                  action={{
                    label: "İlk Projeyi Oluştur",
                    onClick: () => console.log("Create project")
                  }}
                />
              )}
            </div>

            {/* Recent Tasks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Son Görevler</h2>
                <Link href="/dashboard/tasks">
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              </div>
              {recentTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle}
                  title="Henüz görev bulunmuyor"
                  description="İlk görevinizi oluşturarak başlayın"
                  action={{
                    label: "İlk Görevi Oluştur",
                    onClick: () => console.log("Create task")
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Proje Yönetimi</h3>
              <p className="text-muted-foreground mb-4">
                Tüm projelerinizi görüntülemek ve yönetmek için projeler sayfasına gidin
              </p>
              <Link href="/dashboard/projects">
                <Button>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Projeleri Görüntüle
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Görev Yönetimi</h3>
              <p className="text-muted-foreground mb-4">
                Tüm görevlerinizi görüntülemek ve yönetmek için görevler sayfasına gidin
              </p>
              <Link href="/dashboard/tasks">
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Görevleri Görüntüle
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <EmptyState
              icon={Activity}
              title="Aktivite Akışı"
              description="Son aktiviteler burada görüntülenecek"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 