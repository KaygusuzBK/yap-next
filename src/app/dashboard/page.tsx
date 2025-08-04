'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Plus,
  Filter
} from 'lucide-react';
import { DashboardStats, Project, Task } from '@/lib/types';
import { dashboardService, projectService, taskService } from '@/lib/services/real-api';
import { demoProjects } from '@/data/demo/projects';
import { demoTasks } from '@/data/demo/tasks';
import { demoUsers } from '@/data/demo/users';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setError(null);
        const [statsData, projectsResponse, tasksResponse] = await Promise.all([
          dashboardService.getDashboardStats(),
          projectService.getAllProjects(),
          taskService.getAllTasks()
        ]);

        setStats(statsData);
        setRecentProjects(projectsResponse.data.filter(p => p.status === 'active').slice(0, 5));
        setRecentTasks(tasksResponse.data.filter(t => t.status === 'in_progress').slice(0, 5));
      } catch (error) {
        console.error('Dashboard verileri yüklenirken hata:', error);
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
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Bağlantı Hatası</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tekrar Dene
          </Button>
        </div>
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

      <div className="container mx-auto px-4 py-8">
        {/* İstatistik Kartları */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Proje</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeProjects} aktif proje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedTasks} tamamlandı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ekip Üyeleri</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.teamMembers}</div>
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
                <div className="text-2xl font-bold">{stats.totalHours}h</div>
                <p className="text-xs text-muted-foreground">
                  Harcanan toplam saat
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ana İçerik */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="projects">Projeler</TabsTrigger>
            <TabsTrigger value="tasks">Görevler</TabsTrigger>
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Aktif Projeler */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Aktif Projeler
                  </CardTitle>
                  <CardDescription>
                    Devam eden projelerin durumu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.description ? project.description.substring(0, 60) + '...' : 'Açıklama yok'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{project.progress}%</div>
                        <div className="w-20 bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Devam Eden Görevler */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Devam Eden Görevler
                  </CardTitle>
                  <CardDescription>
                    Şu anda çalışılan görevler
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={
                            task.priority === 'urgent' ? 'destructive' :
                            task.priority === 'high' ? 'default' :
                            task.priority === 'medium' ? 'secondary' : 'outline'
                          }>
                            {task.priority}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {task.actualHours || 0}h / {task.estimatedHours || 0}h
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Geciken Görevler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Geciken Görevler
                </CardTitle>
                <CardDescription>
                  Son teslim tarihi geçmiş görevler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Geciken görev bulunmuyor. Harika iş çıkarıyorsunuz! 🎉
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tüm Projeler</CardTitle>
                <CardDescription>
                  Projelerinizin detaylı listesi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{project.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description || 'Açıklama yok'}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={
                            project.status === 'active' ? 'default' :
                            project.status === 'completed' ? 'secondary' :
                            project.status === 'paused' ? 'outline' : 'destructive'
                          }>
                            {project.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(project.startDate).toLocaleDateString('tr-TR')} - {new Date(project.endDate).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{project.progress}%</div>
                        <div className="w-24 bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tüm Görevler</CardTitle>
                <CardDescription>
                  Görevlerinizin detaylı listesi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={
                            task.status === 'completed' ? 'secondary' :
                            task.status === 'in_progress' ? 'default' :
                            task.status === 'review' ? 'outline' : 'outline'
                          }>
                            {task.status}
                          </Badge>
                          <Badge variant={
                            task.priority === 'urgent' ? 'destructive' :
                            task.priority === 'high' ? 'default' :
                            task.priority === 'medium' ? 'secondary' : 'outline'
                          }>
                            {task.priority}
                          </Badge>
                          {task.dueDate && (
                            <span className="text-sm text-muted-foreground">
                              Teslim: {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {task.actualHours || 0}h / {task.estimatedHours || 0}h
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.tags.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analitik</CardTitle>
                <CardDescription>
                  Proje ve görev performans analizi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Analitik grafikleri burada görüntülenecek
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 