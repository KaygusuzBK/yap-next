"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Users,
  Target,
  Activity,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';
import type { Task } from '../api';

interface PerformanceData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  productivityScore: number;
  teamStats: {
    userId: string;
    userName: string;
    completedTasks: number;
    totalTasks: number;
    completionRate: number;
  }[];
  dailyStats: {
    date: string;
    completed: number;
    created: number;
    inProgress: number;
  }[];
  priorityStats: {
    priority: string;
    total: number;
    completed: number;
    completionRate: number;
  }[];
  projectStats: {
    projectId: string;
    projectName: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageTime: number;
  }[];
}

interface PerformanceReportsProps {
  projectId?: string;
  teamId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  priorities?: string[];
  statuses?: string[];
  searchTerm?: string;
}

export default function PerformanceReports({ 
  projectId, 
  teamId, 
  dateRange,
  priorities = [],
  statuses = [],
  searchTerm = ''
}: PerformanceReportsProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedView, setSelectedView] = useState('overview');

  const supabase = getSupabase();

  // Performans verilerini yükle
  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange?.start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end || new Date();

      // Temel görev istatistikleri - tüm görevleri çek (tarih filtresi olmadan)
      let taskQuery = supabase
        .from('tasks')
        .select('*');

      if (projectId) {
        taskQuery = taskQuery.eq('project_id', projectId);
      }

      // Filtreleme uygula
      if (priorities.length > 0) {
        taskQuery = taskQuery.in('priority', priorities);
      }

      if (statuses.length > 0) {
        taskQuery = taskQuery.in('status', statuses);
      }

      if (searchTerm) {
        taskQuery = taskQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data: allTasks, error: tasksError } = await taskQuery;
      if (tasksError) throw tasksError;

      // Tarih aralığına göre filtrele
      const tasks = allTasks?.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate >= startDate && taskDate <= endDate;
      }) || [];

      // Takım üyeleri - sadece kullanıcı bilgilerini çek
      const { data: teamMembers, error: teamError } = await supabase
        .from('project_members')
        .select(`
          user_id,
          users!inner(id, full_name)
        `)
        .eq('project_id', projectId || '');
      
      if (teamError) {
        console.warn('Team members could not be loaded:', teamError);
      }

      // Projeler
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId || '');
      
      if (projectError) {
        console.warn('Projects could not be loaded:', projectError);
      }

      // Görev aktiviteleri - basitleştirilmiş
      const { data: activities, error: activitiesError } = await supabase
        .from('project_activities')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (activitiesError) {
        console.warn('Activities could not be loaded:', activitiesError);
      }

      // İstatistikleri hesapla
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
      const overdueTasks = tasks?.filter(t => 
        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
      ).length || 0;

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Ortalama tamamlanma süresi
      const completedTasksWithTime = tasks?.filter(t => 
        t.status === 'completed' && t.updated_at && t.created_at
      ) || [];

      const averageCompletionTime = completedTasksWithTime.length > 0 
        ? completedTasksWithTime.reduce((acc, task) => {
            const created = new Date(task.created_at);
            const completed = new Date(task.updated_at);
            return acc + (completed.getTime() - created.getTime());
          }, 0) / completedTasksWithTime.length / (1000 * 60 * 60 * 24) // gün cinsinden
        : 0;

      // Üretkenlik skoru (günlük tamamlanan görev sayısı)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const productivityScore = daysDiff > 0 ? completedTasks / daysDiff : 0;

      // Takım istatistikleri - gerçek verilerle
      const teamStats = teamMembers?.map(member => {
        const memberTasks = tasks?.filter(t => t.created_by === member.user_id) || [];
        const memberCompleted = memberTasks.filter(t => t.status === 'completed').length;
        return {
          userId: member.user_id,
          userName: (member as any).users?.full_name || 'Bilinmeyen',
          completedTasks: memberCompleted,
          totalTasks: memberTasks.length,
          completionRate: memberTasks.length > 0 ? (memberCompleted / memberTasks.length) * 100 : 0
        };
      }).filter(member => member.totalTasks > 0) || []; // Sadece görevi olan üyeleri göster

      // Günlük istatistikler
      const dailyStats = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayTasks = tasks?.filter(t => {
          const taskDate = new Date(t.created_at);
          return taskDate.toDateString() === d.toDateString();
        }) || [];

        const dayCompleted = dayTasks.filter(t => t.status === 'completed').length;
        const dayInProgress = dayTasks.filter(t => t.status === 'in_progress').length;

        dailyStats.push({
          date: d.toISOString().split('T')[0],
          completed: dayCompleted,
          created: dayTasks.length,
          inProgress: dayInProgress
        });
      }

      // Öncelik istatistikleri
      const priorityStats = ['urgent', 'high', 'medium', 'low'].map(priority => {
        const priorityTasks = tasks?.filter(t => t.priority === priority) || [];
        const priorityCompleted = priorityTasks.filter(t => t.status === 'completed').length;
        return {
          priority,
          total: priorityTasks.length,
          completed: priorityCompleted,
          completionRate: priorityTasks.length > 0 ? (priorityCompleted / priorityTasks.length) * 100 : 0
        };
      });

      // Proje istatistikleri - gerçek verilerle
      const projectStats = projects?.map(project => {
        const projectTasks = tasks?.filter(t => t.project_id === project.id) || [];
        const projectCompleted = projectTasks.filter(t => t.status === 'completed').length;
        const projectCompletedWithTime = projectTasks.filter(t => 
          t.status === 'completed' && t.updated_at && t.created_at
        );

        const averageTime = projectCompletedWithTime.length > 0 
          ? projectCompletedWithTime.reduce((acc, task) => {
              const created = new Date(task.created_at);
              const completed = new Date(task.updated_at);
              return acc + (completed.getTime() - created.getTime());
            }, 0) / projectCompletedWithTime.length / (1000 * 60 * 60 * 24)
          : 0;

        return {
          projectId: project.id,
          projectName: project.title,
          totalTasks: projectTasks.length,
          completedTasks: projectCompleted,
          completionRate: projectTasks.length > 0 ? (projectCompleted / projectTasks.length) * 100 : 0,
          averageTime
        };
      }).filter(project => project.totalTasks > 0) || []; // Sadece görevi olan projeleri göster

      setData({
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
        averageCompletionTime,
        productivityScore,
        teamStats,
        dailyStats,
        priorityStats,
        projectStats
      });

    } catch (error) {
      toast.error('Performans verileri yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, [projectId, teamId, dateRange, selectedPeriod]);

  // Rapor indirme
  const handleExportReport = () => {
    if (!data) return;

    const reportData = {
      period: selectedPeriod,
      dateRange: dateRange,
      data: data
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Rapor indirildi');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Rapor yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <div className="text-muted-foreground">Veri bulunamadı</div>
            <div className="text-sm text-muted-foreground mt-2">
              Seçilen tarih aralığında görev bulunmuyor
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Kontroller */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performans Raporları
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Son Hafta</SelectItem>
                  <SelectItem value="month">Son Ay</SelectItem>
                  <SelectItem value="quarter">Son Çeyrek</SelectItem>
                  <SelectItem value="year">Son Yıl</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                İndir
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Görev</p>
                <p className="text-2xl font-bold">{data.totalTasks}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamamlanan</p>
                <p className="text-2xl font-bold text-green-600">{data.completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamamlanma Oranı</p>
                <p className="text-2xl font-bold">{data.completionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ortalama Süre</p>
                <p className="text-2xl font-bold">{data.averageCompletionTime.toFixed(1)} gün</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detaylı Raporlar */}
      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="team">Takım</TabsTrigger>
          <TabsTrigger value="projects">Projeler</TabsTrigger>
          <TabsTrigger value="daily">Günlük</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Öncelik Dağılımı */}
            <Card>
              <CardHeader>
                <CardTitle>Öncelik Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.priorityStats.map(stat => (
                    <div key={stat.priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          stat.priority === 'urgent' ? 'destructive' :
                          stat.priority === 'high' ? 'default' :
                          stat.priority === 'medium' ? 'secondary' : 'outline'
                        }>
                          {stat.priority}
                        </Badge>
                        <span className="text-sm">{stat.total} görev</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.completionRate.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Durum Dağılımı */}
            <Card>
              <CardHeader>
                <CardTitle>Durum Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Tamamlanan</span>
                    </div>
                    <span className="text-sm font-medium">{data.completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Devam Eden</span>
                    </div>
                    <span className="text-sm font-medium">{data.inProgressTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Geciken</span>
                    </div>
                    <span className="text-sm font-medium">{data.overdueTasks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Takım Performansı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.teamStats.map(member => (
                  <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">{member.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.completedTasks}/{member.totalTasks} görev
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{member.completionRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">tamamlanma</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proje Performansı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.projectStats.map(project => (
                  <div key={project.projectId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">{project.projectName}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.completedTasks}/{project.totalTasks} görev
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{project.completionRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">
                        {project.averageTime.toFixed(1)} gün ortalama
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Günlük Aktivite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.dailyStats.slice(-7).map(day => (
                  <div key={day.date} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">
                        {new Date(day.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">+{day.completed}</span>
                      <span className="text-blue-600">{day.inProgress}</span>
                      <span className="text-muted-foreground">{day.created} oluşturuldu</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
