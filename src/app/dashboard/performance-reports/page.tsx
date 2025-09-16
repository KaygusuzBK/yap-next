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
import PerformanceFilters, { type FilterState } from '@/components/performance/PerformanceFilters';
import PerformanceDemoData from '@/components/performance/PerformanceDemoData';
import { useProjects } from '@/features/projects/queries';
import { useTeams } from '@/features/teams/queries';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function PerformanceReportsPage() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Son 7 gün
      end: new Date()
    },
    projects: [],
    teams: [],
    priorities: [],
    statuses: [],
    searchTerm: '',
    viewType: 'overview'
  });

  const { data: projects = [] } = useProjects();
  const { data: teams = [] } = useTeams();

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
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
                {filters.dateRange.start.toLocaleDateString('tr-TR')} - {filters.dateRange.end.toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>

          {/* Filtreler */}
          <PerformanceFilters
            projects={projects}
            teams={teams}
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />

          {/* Raporlar */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="team">Takım</TabsTrigger>
              <TabsTrigger value="projects">Projeler</TabsTrigger>
              <TabsTrigger value="analytics">Analitik</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <PerformanceDemoData />
            </TabsContent>

            <TabsContent value="team" className="mt-6">
              <PerformanceReports
                projectId={filters.projects.length === 1 ? filters.projects[0] : undefined}
                teamId={filters.teams.length === 1 ? filters.teams[0] : undefined}
                dateRange={filters.dateRange}
                priorities={filters.priorities}
                statuses={filters.statuses}
                searchTerm={filters.searchTerm}
              />
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <PerformanceReports
                projectId={filters.projects.length === 1 ? filters.projects[0] : undefined}
                teamId={filters.teams.length === 1 ? filters.teams[0] : undefined}
                dateRange={filters.dateRange}
                priorities={filters.priorities}
                statuses={filters.statuses}
                searchTerm={filters.searchTerm}
              />
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
