"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assignTaskToUser, unassignTask, getProjectMembers } from '../api';
import { toast } from 'sonner';
import { User, UserCheck, UserX, Loader2 } from 'lucide-react';

interface TaskAssignmentProps {
  taskId: string;
  projectId: string;
  currentAssignee?: string | null;
  onAssignmentChange?: () => void;
}

export default function TaskAssignment({ 
  taskId, 
  projectId, 
  currentAssignee, 
  onAssignmentChange 
}: TaskAssignmentProps) {
  const [members, setMembers] = useState<Array<{ id: string; email: string; name?: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const loadProjectMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      const projectMembers = await getProjectMembers(projectId);
      setMembers(projectMembers);
    } catch (error) {
      console.error('Proje üyeleri yüklenirken hata:', error);
      toast.error('Proje üyeleri yüklenirken bir hata oluştu');
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectMembers();
  }, [projectId, loadProjectMembers]);

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Lütfen bir kullanıcı seçin');
      return;
    }

    try {
      setLoading(true);
      await assignTaskToUser(taskId, selectedUserId);
      toast.success('Görev başarıyla atandı');
      setSelectedUserId('');
      onAssignmentChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Görev atanırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    try {
      setLoading(true);
      await unassignTask(taskId);
      toast.success('Görev ataması kaldırıldı');
      onAssignmentChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Görev ataması kaldırılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAssigneeName = () => {
    if (!currentAssignee) return null;
    const member = members.find(m => m.id === currentAssignee);
    return member?.name || member?.email || 'Bilinmeyen kullanıcı';
  };

  if (loadingMembers) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Üyeler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4" />
        <Label className="text-sm font-medium">Görev Ataması</Label>
      </div>

      {currentAssignee ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <UserCheck className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Atanmış Kullanıcı</p>
              <p className="text-xs text-muted-foreground">{getCurrentAssigneeName()}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnassign}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <UserX className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <UserX className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Atanmamış</p>
              <p className="text-xs text-muted-foreground">Bu görev henüz kimseye atanmamış</p>
            </div>
          </div>

          {members.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="assign-user" className="text-xs">Kullanıcı Seçin</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kullanıcı seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleAssign}
                disabled={loading || !selectedUserId}
                size="sm"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Atanıyor...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3 w-3 mr-2" />
                    Görevi Ata
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center p-4 text-sm text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Bu projede henüz üye yok</p>
              <p className="text-xs">Görev atamak için önce projeye üye ekleyin</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
