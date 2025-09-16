"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Download,
  Calendar,
  Users,
  Target
} from 'lucide-react';
import PerformanceReports from '@/features/tasks/components/PerformanceReports';
import { useProjects } from '@/features/projects/queries';
import { useTeams } from '@/features/teams/queries';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function PerformanceReportsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Son 7 gün
    end: new Date()
  });

  const { data: projects = [] } = useProjects();
  const { data: teams = [] } = useTeams();

  const handleDateRangeChange = (range: string) => {
    const now = new Date();
    let start: Date;

    switch (range) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    setDateRange({ start, end: now });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Performans Raporları" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Başlık */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Performans Raporları</h1>
              <p className="text-muted-foreground mt-2">
                Proje ve takım performansınızı analiz edin
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {dateRange.start.toLocaleDateString('tr-TR')} - {dateRange.end.toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>

          {/* Filtreler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Rapor Filtreleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Zaman Aralığı</label>
                  <Select onValueChange={handleDateRangeChange} defaultValue="week">
                    <SelectTrigger>
                      <SelectValue placeholder="Zaman aralığı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Son Hafta</SelectItem>
                      <SelectItem value="month">Son Ay</SelectItem>
                      <SelectItem value="quarter">Son Çeyrek</SelectItem>
                      <SelectItem value="year">Son Yıl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Proje</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm projeler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tüm Projeler</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Takım</label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm takımlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tüm Takımlar</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raporlar */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="team">Takım</TabsTrigger>
              <TabsTrigger value="projects">Projeler</TabsTrigger>
              <TabsTrigger value="analytics">Analitik</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <PerformanceReports
                projectId={selectedProject || undefined}
                teamId={selectedTeam || undefined}
                dateRange={dateRange}
              />
            </TabsContent>

            <TabsContent value="team" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Takım Performansı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Detaylı takım analizi yakında...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Proje Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Detaylı proje analizi yakında...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Gelişmiş Analitik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Gelişmiş analitik araçları yakında...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
