"use client";

import { useEffect, useState } from 'react';
import { type Team, updateTeam, deleteTeam, getTeamStats, type TeamStats } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreVertical, 
  Users, 
  FolderOpen, 
  CheckCircle, 
  Clock,
  Settings,
  UserPlus,
  Crown
} from 'lucide-react';
import Input from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ChangeEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useTeams, teamKeys } from '@/features/teams/queries';
import { useQueryClient } from '@tanstack/react-query';

export default function TeamList({ refreshKey }: { refreshKey?: number }) {
  const qc = useQueryClient();
  const { data: items = [], isLoading: loading, error } = useTeams();
  const [teamStats, setTeamStats] = useState<Record<string, TeamStats>>({});

  useEffect(() => {
    (async () => {
      try {
        // Her takım için istatistikleri al
        const stats: Record<string, TeamStats> = {};
        for (const team of items) {
          try {
            stats[team.id] = await getTeamStats(team.id);
          } catch (e) {
            console.warn(`Takım ${team.id} istatistikleri alınamadı:`, e);
          }
        }
        setTeamStats(stats);
      } catch {}
    })();
  }, [items]);

  useEffect(() => {
    if (refreshKey !== undefined) {
      qc.invalidateQueries({ queryKey: teamKeys.all() }).catch(() => {})
    }
  }, [refreshKey, qc]);

  if (loading) return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 border rounded">
          <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
  
  if (error) return <p className="text-sm text-red-600">{error.message}</p>;
  if (!items.length) return <p className="text-sm text-muted-foreground py-8">Henüz takım yok. İlk takımınızı oluşturun.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((team) => (
        <TeamCard 
          key={team.id} 
          team={team} 
          stats={teamStats[team.id]}
          onUpdated={() => { qc.invalidateQueries({ queryKey: teamKeys.all() }).catch(() => {}) }}
          onDeleted={() => { qc.invalidateQueries({ queryKey: teamKeys.all() }).catch(() => {}) }}
        />
      ))}
    </div>
  );
}

function TeamCard({ 
  team, 
  stats, 
  onUpdated, 
  onDeleted 
}: { 
  team: Team; 
  stats?: TeamStats;
  onUpdated: (team: Team) => void; 
  onDeleted: () => void; 
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: team.name,
    description: team.description || '',
    avatar_url: team.avatar_url || ''
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedTeam = await updateTeam({ 
        team_id: team.id, 
        ...editData 
      });
      onUpdated(updatedTeam);
      setOpenEdit(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteTeam(team.id);
    setOpenDelete(false);
    onDeleted();
  };

  const isOwner = true; // TODO: Get from context
  const canEdit = isOwner;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={team.avatar_url || undefined} />
                <AvatarFallback className="text-lg font-semibold">
                  {team.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold truncate">
                  {team.name}
                </CardTitle>
                {team.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {team.description}
                  </p>
                )}
              </div>
            </div>
            {canEdit && (
              <TeamMenu
                team={team}
                onEdit={() => setOpenEdit(true)}
                onDelete={() => setOpenDelete(true)}
              />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Takım İstatistikleri */}
          {stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{stats.member_count}</span>
                <span className="text-muted-foreground">üye</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{stats.project_count}</span>
                <span className="text-muted-foreground">proje</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{stats.active_task_count}</span>
                <span className="text-muted-foreground">aktif görev</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{stats.completed_task_count}</span>
                <span className="text-muted-foreground">tamamlanan</span>
              </div>
            </div>
          )}
          
          {/* Aksiyon Butonları */}
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/dashboard/teams/${team.id}`}>
                <Users className="h-4 w-4 mr-2" />
                Yönet
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/dashboard/teams/${team.id}/members`}>
                <UserPlus className="h-4 w-4 mr-2" />
                Üyeler
              </Link>
            </Button>
          </div>
          
          {/* Takım Sahibi */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Crown className="h-3 w-3" />
            <span>Takım sahibi: {team.owner_id.slice(0, 8)}...</span>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Takım bilgilerini düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Takım adı</label>
              <Input 
                value={editData.name} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  setEditData(prev => ({ ...prev, name: e.target.value }))
                } 
                placeholder="Takım adı"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea 
                value={editData.description} 
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                  setEditData(prev => ({ ...prev, description: e.target.value }))
                } 
                placeholder="Takım açıklaması (opsiyonel)"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Avatar URL</label>
              <Input 
                value={editData.avatar_url} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  setEditData(prev => ({ ...prev, avatar_url: e.target.value }))
                } 
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Vazgeç
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misin?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Takım kalıcı olarak silinecek ve tüm üyeler çıkarılacak.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TeamMenu({ 
  team, 
  onEdit, 
  onDelete 
}: { 
  team: Team; 
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Takım İşlemleri</DropdownMenuLabel>
        <DropdownMenuItem onClick={onEdit}>
          <Settings className="h-4 w-4 mr-2" />
          Düzenle
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600" onClick={onDelete}>
          <MoreVertical className="h-4 w-4 mr-2" />
          Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


