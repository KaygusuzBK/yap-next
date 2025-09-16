"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Link, 
  Link2, 
  Copy, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  createTaskDependency, 
  deleteTaskDependency, 
  getTaskDependencies, 
  getTaskDependents,
  getTaskDependencyStats,
  getDependencyChain,
  checkDependencyCycle
} from '../api/dependencies';
import type { 
  TaskDependency, 
  DependencyStats, 
  DependencyChain,
  DependencyType 
} from '../types/dependencies';
import type { Task } from '../api';

interface TaskDependencyManagerProps {
  task: Task;
  projectTasks: Task[];
  onDependencyChange?: () => void;
}

export default function TaskDependencyManager({ 
  task, 
  projectTasks, 
  onDependencyChange 
}: TaskDependencyManagerProps) {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [dependents, setDependents] = useState<TaskDependency[]>([]);
  const [stats, setStats] = useState<DependencyStats | null>(null);
  const [chain, setChain] = useState<DependencyChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showChainDialog, setShowChainDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DependencyType | 'all'>('all');

  // Yeni bağımlılık formu
  const [newDependency, setNewDependency] = useState({
    depends_on_task_id: '',
    dependency_type: 'blocks' as DependencyType
  });

  // Verileri yükle
  const loadData = async () => {
    setLoading(true);
    try {
      const [deps, deps2, statsData, chainData] = await Promise.all([
        getTaskDependencies(task.id),
        getTaskDependents(task.id),
        getTaskDependencyStats(task.id),
        getDependencyChain(task.id)
      ]);
      
      setDependencies(deps);
      setDependents(deps2);
      setStats(statsData);
      setChain(chainData);
    } catch (error) {
      toast.error('Bağımlılık verileri yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [task.id]);

  // Bağımlılık ekle
  const handleAddDependency = async () => {
    if (!newDependency.depends_on_task_id) {
      toast.error('Lütfen bir görev seçin');
      return;
    }

    try {
      // Döngü kontrolü
      const hasCycle = await checkDependencyCycle(task.id, newDependency.depends_on_task_id);
      if (hasCycle) {
        toast.error('Döngüsel bağımlılık oluşturulamaz');
        return;
      }

      await createTaskDependency({
        task_id: task.id,
        depends_on_task_id: newDependency.depends_on_task_id,
        dependency_type: newDependency.dependency_type
      });

      toast.success('Bağımlılık eklendi');
      setNewDependency({ depends_on_task_id: '', dependency_type: 'blocks' });
      setShowAddDialog(false);
      loadData();
      onDependencyChange?.();
    } catch (error) {
      toast.error('Bağımlılık eklenemedi');
      console.error(error);
    }
  };

  // Bağımlılık sil
  const handleDeleteDependency = async (dependencyId: string) => {
    try {
      await deleteTaskDependency(dependencyId);
      toast.success('Bağımlılık silindi');
      loadData();
      onDependencyChange?.();
    } catch (error) {
      toast.error('Bağımlılık silinemedi');
      console.error(error);
    }
  };

  // Filtrelenmiş bağımlılıklar
  const filteredDependencies = dependencies.filter(dep => {
    const dependsOnTask = (dep as any).depends_on_task;
    const matchesSearch = dependsOnTask?.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || dep.dependency_type === filterType;
    return matchesSearch && matchesType;
  });

  // Bağımlılık türü ikonu
  const getDependencyIcon = (type: DependencyType) => {
    switch (type) {
      case 'blocks': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'relates_to': return <Link2 className="h-4 w-4 text-blue-500" />;
      case 'duplicates': return <Copy className="h-4 w-4 text-orange-500" />;
    }
  };

  // Bağımlılık türü rengi
  const getDependencyColor = (type: DependencyType) => {
    switch (type) {
      case 'blocks': return 'bg-red-100 text-red-800 border-red-200';
      case 'relates_to': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'duplicates': return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  // Durum ikonu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Görev Bağımlılıkları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Yükleniyor...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Bağımlılık İstatistikleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_dependencies}</div>
                <div className="text-sm text-muted-foreground">Toplam Bağımlılık</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.blocking_dependencies}</div>
                <div className="text-sm text-muted-foreground">Engelleyici</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.related_dependencies}</div>
                <div className="text-sm text-muted-foreground">İlgili</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.duplicate_dependencies}</div>
                <div className="text-sm text-muted-foreground">Tekrar</div>
              </div>
            </div>
            
            {stats.blocked_by_tasks.length > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Bu görev şu görevler tarafından engelleniyor: {stats.blocked_by_tasks.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bağımlılık Yönetimi */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bağımlılıklar</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChainDialog(true)}
              >
                <Link className="h-4 w-4 mr-2" />
                Zincir Görünümü
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Bağımlılık Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yeni Bağımlılık Ekle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Bağımlı Olunan Görev</Label>
                      <Select
                        value={newDependency.depends_on_task_id}
                        onValueChange={(value) => setNewDependency(prev => ({ ...prev, depends_on_task_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Görev seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectTasks
                            .filter(t => t.id !== task.id)
                            .map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(t.status)}
                                  <span>{t.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {t.priority}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Bağımlılık Türü</Label>
                      <Select
                        value={newDependency.dependency_type}
                        onValueChange={(value: DependencyType) => setNewDependency(prev => ({ ...prev, dependency_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blocks">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              Engeller
                            </div>
                          </SelectItem>
                          <SelectItem value="relates_to">
                            <div className="flex items-center gap-2">
                              <Link2 className="h-4 w-4 text-blue-500" />
                              İlgili
                            </div>
                          </SelectItem>
                          <SelectItem value="duplicates">
                            <div className="flex items-center gap-2">
                              <Copy className="h-4 w-4 text-orange-500" />
                              Tekrar
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        İptal
                      </Button>
                      <Button onClick={handleAddDependency}>
                        Ekle
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtreler */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Görev ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={(value: DependencyType | 'all') => setFilterType(value)}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="blocks">Engeller</SelectItem>
                <SelectItem value="relates_to">İlgili</SelectItem>
                <SelectItem value="duplicates">Tekrar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bağımlılık Listesi */}
          <div className="space-y-2">
            {filteredDependencies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterType !== 'all' ? 'Filtreye uygun bağımlılık bulunamadı' : 'Henüz bağımlılık yok'}
              </div>
            ) : (
              filteredDependencies.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getDependencyIcon(dep.dependency_type)}
                    <div>
                      <div className="font-medium">{(dep as any).depends_on_task?.title}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getStatusIcon((dep as any).depends_on_task?.status || '')}
                        <span>{(dep as any).depends_on_task?.status}</span>
                        <Badge variant="outline" className="text-xs">
                          {(dep as any).depends_on_task?.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getDependencyColor(dep.dependency_type)}>
                      {dep.dependency_type === 'blocks' ? 'Engeller' :
                       dep.dependency_type === 'relates_to' ? 'İlgili' : 'Tekrar'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDependency(dep.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bağımlılık Zinciri Dialog */}
      <Dialog open={showChainDialog} onOpenChange={setShowChainDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bağımlılık Zinciri</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {chain.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded border"
                  style={{ marginLeft: `${item.depth * 20}px` }}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-medium">{item.task_title}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.task_status}
                  </Badge>
                  {item.dependency_type !== 'root' && (
                    <Badge variant="secondary" className="text-xs">
                      {item.dependency_type}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
