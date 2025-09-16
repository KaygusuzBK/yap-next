"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

// Örnek performans verileri
const demoData = {
  totalTasks: 47,
  completedTasks: 32,
  inProgressTasks: 12,
  overdueTasks: 3,
  completionRate: 68.1,
  averageCompletionTime: 4.2,
  productivityScore: 2.1,
  teamStats: [
    {
      userId: "user1",
      userName: "Ahmet Yılmaz",
      completedTasks: 8,
      totalTasks: 12,
      completionRate: 66.7
    },
    {
      userId: "user2", 
      userName: "Ayşe Demir",
      completedTasks: 15,
      totalTasks: 18,
      completionRate: 83.3
    },
    {
      userId: "user3",
      userName: "Mehmet Kaya",
      completedTasks: 6,
      totalTasks: 10,
      completionRate: 60.0
    },
    {
      userId: "user4",
      userName: "Fatma Özkan",
      completedTasks: 3,
      totalTasks: 7,
      completionRate: 42.9
    }
  ],
  dailyStats: [
    { date: "2024-01-15", completed: 3, created: 2, inProgress: 5 },
    { date: "2024-01-16", completed: 5, created: 1, inProgress: 4 },
    { date: "2024-01-17", completed: 2, created: 3, inProgress: 6 },
    { date: "2024-01-18", completed: 7, created: 2, inProgress: 3 },
    { date: "2024-01-19", completed: 4, created: 1, inProgress: 5 },
    { date: "2024-01-20", completed: 6, created: 4, inProgress: 2 },
    { date: "2024-01-21", completed: 5, created: 2, inProgress: 4 }
  ],
  priorityStats: [
    { priority: "urgent", total: 8, completed: 6, completionRate: 75.0 },
    { priority: "high", total: 15, completed: 12, completionRate: 80.0 },
    { priority: "medium", total: 18, completed: 11, completionRate: 61.1 },
    { priority: "low", total: 6, completed: 3, completionRate: 50.0 }
  ],
  projectStats: [
    {
      projectId: "proj1",
      projectName: "E-Ticaret Platformu",
      totalTasks: 22,
      completedTasks: 18,
      completionRate: 81.8,
      averageTime: 3.5
    },
    {
      projectId: "proj2",
      projectName: "Mobil Uygulama",
      totalTasks: 15,
      completedTasks: 9,
      completionRate: 60.0,
      averageTime: 5.2
    },
    {
      projectId: "proj3",
      projectName: "API Geliştirme",
      totalTasks: 10,
      completedTasks: 5,
      completionRate: 50.0,
      averageTime: 6.8
    }
  ]
};

export default function PerformanceDemoData() {
  return (
    <div className="space-y-6">
      {/* Başlık ve Kontroller */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performans Raporları - Örnek Veri
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
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
                <p className="text-2xl font-bold">{demoData.totalTasks}</p>
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
                <p className="text-2xl font-bold text-green-600">{demoData.completedTasks}</p>
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
                <p className="text-2xl font-bold">{demoData.completionRate}%</p>
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
                <p className="text-2xl font-bold">{demoData.averageCompletionTime} gün</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detaylı Raporlar */}
      <div className="space-y-6">
        {/* Genel Bakış */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Öncelik Dağılımı */}
          <Card>
            <CardHeader>
              <CardTitle>Öncelik Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {demoData.priorityStats.map(stat => (
                  <div key={stat.priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        stat.priority === 'urgent' ? 'destructive' :
                        stat.priority === 'high' ? 'default' :
                        stat.priority === 'medium' ? 'secondary' : 'outline'
                      }>
                        {stat.priority === 'urgent' ? 'Acil' :
                         stat.priority === 'high' ? 'Yüksek' :
                         stat.priority === 'medium' ? 'Orta' : 'Düşük'}
                      </Badge>
                      <span className="text-sm">{stat.total} görev</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.completionRate}%
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
                  <span className="text-sm font-medium">{demoData.completedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Devam Eden</span>
                  </div>
                  <span className="text-sm font-medium">{demoData.inProgressTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Geciken</span>
                  </div>
                  <span className="text-sm font-medium">{demoData.overdueTasks}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Takım Performansı */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Takım Performansı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoData.teamStats.map(member => (
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
                    <div className="text-lg font-bold">{member.completionRate}%</div>
                    <div className="text-sm text-muted-foreground">tamamlanma</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Proje Performansı */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Proje Performansı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoData.projectStats.map(project => (
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
                    <div className="text-lg font-bold">{project.completionRate}%</div>
                    <div className="text-sm text-muted-foreground">
                      {project.averageTime} gün ortalama
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Günlük Aktivite */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Günlük Aktivite (Son 7 Gün)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {demoData.dailyStats.map(day => (
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
      </div>
    </div>
  );
}
