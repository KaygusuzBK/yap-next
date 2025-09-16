"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Filter, 
  X, 
  Search,
  Target,
  Users,
  Folder
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PerformanceFiltersProps {
  projects: Array<{ id: string; title: string; status: string }>;
  teams: Array<{ id: string; name: string }>;
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  dateRange: {
    start: Date;
    end: Date;
  };
  projects: string[];
  teams: string[];
  priorities: string[];
  statuses: string[];
  searchTerm: string;
  viewType: 'overview' | 'team' | 'projects' | 'analytics';
}

const defaultFilters: FilterState = {
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  projects: [],
  teams: [],
  priorities: [],
  statuses: [],
  searchTerm: '',
  viewType: 'overview'
};

export default function PerformanceFilters({ 
  projects, 
  teams, 
  onFiltersChange, 
  initialFilters = defaultFilters 
}: PerformanceFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const handleDateRangeChange = (range: string) => {
    const now = new Date();
    let start: Date;

    switch (range) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
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

    updateFilters({
      dateRange: { start, end: now }
    });
  };

  const toggleProject = (projectId: string) => {
    const newProjects = filters.projects.includes(projectId)
      ? filters.projects.filter(id => id !== projectId)
      : [...filters.projects, projectId];
    updateFilters({ projects: newProjects });
  };

  const toggleTeam = (teamId: string) => {
    const newTeams = filters.teams.includes(teamId)
      ? filters.teams.filter(id => id !== teamId)
      : [...filters.teams, teamId];
    updateFilters({ teams: newTeams });
  };

  const togglePriority = (priority: string) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    updateFilters({ priorities: newPriorities });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    updateFilters({ statuses: newStatuses });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.projects.length > 0) count++;
    if (filters.teams.length > 0) count++;
    if (filters.priorities.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.searchTerm) count++;
    return count;
  };

  const priorityOptions = [
    { value: 'urgent', label: 'Acil', color: 'bg-red-100 text-red-800' },
    { value: 'high', label: 'Yüksek', color: 'bg-orange-100 text-orange-800' },
    { value: 'medium', label: 'Orta', color: 'bg-blue-100 text-blue-800' },
    { value: 'low', label: 'Düşük', color: 'bg-green-100 text-green-800' }
  ];

  const statusOptions = [
    { value: 'todo', label: 'Yapılacak', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'Devam Ediyor', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Tamamlandı', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'İptal', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Rapor Filtreleri
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} aktif
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Basit' : 'Gelişmiş'}
            </Button>
            {getActiveFiltersCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Temizle
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Temel Filtreler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tarih Aralığı */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Zaman Aralığı</Label>
              <Select onValueChange={handleDateRangeChange} defaultValue="week">
                <SelectTrigger>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Zaman aralığı seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="week">Son Hafta</SelectItem>
                  <SelectItem value="month">Son Ay</SelectItem>
                  <SelectItem value="quarter">Son Çeyrek</SelectItem>
                  <SelectItem value="year">Son Yıl</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Özel Tarih Seçimi */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Özel Tarih</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange ? (
                      `${format(filters.dateRange.start, "dd MMM", { locale: tr })} - ${format(filters.dateRange.end, "dd MMM", { locale: tr })}`
                    ) : (
                      "Tarih seçin"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: filters.dateRange.start, to: filters.dateRange.end }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        updateFilters({
                          dateRange: { start: range.from, end: range.to }
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Arama */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Arama</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Görev, proje ara..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Gelişmiş Filtreler */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              {/* Projeler */}
              <div>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Projeler
                </Label>
                <div className="flex flex-wrap gap-2">
                  {projects.map(project => (
                    <Button
                      key={project.id}
                      variant={filters.projects.includes(project.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleProject(project.id)}
                      className="text-xs"
                    >
                      {project.title}
                      {project.status !== 'active' && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {project.status}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Takımlar */}
              <div>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Takımlar
                </Label>
                <div className="flex flex-wrap gap-2">
                  {teams.map(team => (
                    <Button
                      key={team.id}
                      variant={filters.teams.includes(team.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTeam(team.id)}
                      className="text-xs"
                    >
                      {team.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Öncelikler */}
              <div>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Öncelikler
                </Label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map(priority => (
                    <Button
                      key={priority.value}
                      variant={filters.priorities.includes(priority.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePriority(priority.value)}
                      className="text-xs"
                    >
                      <Badge 
                        variant="secondary" 
                        className={`mr-1 ${priority.color}`}
                      >
                        {priority.label}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Durumlar */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Durumlar</Label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(status => (
                    <Button
                      key={status.value}
                      variant={filters.statuses.includes(status.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStatus(status.value)}
                      className="text-xs"
                    >
                      <Badge 
                        variant="secondary" 
                        className={`mr-1 ${status.color}`}
                      >
                        {status.label}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Aktif Filtreler Özeti */}
          {getActiveFiltersCount() > 0 && (
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">Aktif Filtreler:</div>
              <div className="flex flex-wrap gap-2">
                {filters.projects.map(projectId => {
                  const project = projects.find(p => p.id === projectId);
                  return project ? (
                    <Badge key={projectId} variant="secondary" className="text-xs">
                      <Folder className="h-3 w-3 mr-1" />
                      {project.title}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => toggleProject(projectId)}
                      />
                    </Badge>
                  ) : null;
                })}
                {filters.teams.map(teamId => {
                  const team = teams.find(t => t.id === teamId);
                  return team ? (
                    <Badge key={teamId} variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {team.name}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => toggleTeam(teamId)}
                      />
                    </Badge>
                  ) : null;
                })}
                {filters.priorities.map(priority => {
                  const priorityOption = priorityOptions.find(p => p.value === priority);
                  return priorityOption ? (
                    <Badge key={priority} variant="secondary" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      {priorityOption.label}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => togglePriority(priority)}
                      />
                    </Badge>
                  ) : null;
                })}
                {filters.statuses.map(status => {
                  const statusOption = statusOptions.find(s => s.value === status);
                  return statusOption ? (
                    <Badge key={status} variant="secondary" className="text-xs">
                      {statusOption.label}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => toggleStatus(status)}
                      />
                    </Badge>
                  ) : null;
                })}
                {filters.searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    <Search className="h-3 w-3 mr-1" />
                    "{filters.searchTerm}"
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilters({ searchTerm: '' })}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
