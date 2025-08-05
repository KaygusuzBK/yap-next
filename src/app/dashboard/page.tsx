'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertTriangle,
  TrendingUp,
  Activity,
  Plus,
  Filter,
  LogOut,
  User,
  Mail,
  Calendar,
  Shield,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { DashboardStats, Project, Task } from '@/lib/types';
import { dashboardService } from '@/lib/services/dashboard/api';
import { projectService } from '@/lib/services/projects/api';
import { taskService } from '@/lib/services/tasks/api';
import { useAuthStore } from '@/lib/services/auth/store';
import { demoProjects } from '@/data/demo/projects';
import { demoTasks } from '@/data/demo/tasks';
import { demoUsers } from '@/data/demo/users';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user, logout } = useAuthStore();
  const router = useRouter();

  const loadDashboardData = async () => {
    try {
      setError(null);
      setRefreshing(true);
      
      const [statsData, projectsResponse, tasksResponse] = await Promise.all([
        dashboardService.getDashboardStats(),
        projectService.getAllProjects(),
        taskService.getAllTasks()
      ]);

      setStats(statsData);
      // API artık array döndürüyor, PaginatedResponse değil
      setRecentProjects(projectsResponse.filter(p => p.status === 'active').slice(0, 5));
      setRecentTasks(tasksResponse.filter(t => t.status === 'in_progress').slice(0, 5));
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      
      // Fallback olarak demo verileri kullan
      const demoStats: DashboardStats = {
        totalProjects: demoProjects.length,
        activeProjects: demoProjects.filter(p => p.status === 'active').length,
        completedProjects: demoProjects.filter(p => p.status === 'completed').length,
        totalTasks: demoTasks.length,
        completedTasks: demoTasks.filter(t => t.status === 'completed').length,
        overdueTasks: demoTasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date() && t.status !== 'completed';
        }).length,
        teamMembers: demoUsers.length,
        totalHours: demoTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
      };
      
      setStats(demoStats);
      setRecentProjects(demoProjects.filter(p => p.status === 'active').slice(0, 5));
      setRecentTasks(demoTasks.filter(t => t.status === 'in_progress').slice(0, 5));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on_hold': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      case 'on_hold': return 'Beklemede';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış
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
                          <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Yönetici' : 'Üye'}
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Proje</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeProjects || 0} aktif proje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.completedTasks || 0} tamamlanan görev
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Takım Üyeleri</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.teamMembers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Aktif ekip üyeleri
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Saat</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalHours || 0}</div>
              <p className="text-xs text-muted-foreground">
                Harcanan toplam saat
              </p>
            </CardContent>
          </Card>
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
                <Button variant="outline" size="sm">
                  Tümünü Gör
                </Button>
              </div>
              {recentProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <Badge variant={getStatusBadgeVariant(project.status)}>
                            {getStatusText(project.status)}
                          </Badge>
                        </div>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>İlerleme</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          {project.budget && (
                            <div className="text-sm text-muted-foreground">
                              Bütçe: ₺{project.budget.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Henüz proje bulunmuyor</p>
                      <Button className="mt-2" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        İlk Projeyi Oluştur
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Tasks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Son Görevler</h2>
                <Button variant="outline" size="sm">
                  Tümünü Gör
                </Button>
              </div>
              {recentTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <Badge 
                            variant={
                              task.priority === 'high' ? 'destructive' : 
                              task.priority === 'medium' ? 'default' : 'secondary'
                            }
                          >
                            {task.priority === 'high' ? 'Yüksek' : 
                             task.priority === 'medium' ? 'Orta' : 'Düşük'}
                          </Badge>
                        </div>
                        <CardDescription>{task.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Durum</span>
                            <Badge variant="outline">
                              {task.status === 'in_progress' ? 'Devam Ediyor' : 
                               task.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                            </Badge>
                          </div>
                          {task.dueDate && (
                            <div className="text-sm text-muted-foreground">
                              Son Tarih: {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                            </div>
                          )}
                          {task.estimatedHours && (
                            <div className="text-sm text-muted-foreground">
                              Tahmini: {task.estimatedHours} saat
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Henüz görev bulunmuyor</p>
                      <Button className="mt-2" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        İlk Görevi Oluştur
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Proje Yönetimi</h3>
              <p className="text-muted-foreground">Proje detayları burada görüntülenecek</p>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Görev Yönetimi</h3>
              <p className="text-muted-foreground">Görev detayları burada görüntülenecek</p>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aktivite Akışı</h3>
              <p className="text-muted-foreground">Son aktiviteler burada görüntülenecek</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 