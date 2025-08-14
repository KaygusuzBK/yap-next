"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  User,
  ArrowLeft,
  Settings,
  Trash2,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { 
  fetchTeams, 
  type Team, 
  getTeamMembers, 
  type TeamMember,
  type TeamRole,
  updateTeamMemberRole,
  removeTeamMember,
  leaveTeam,
  transferTeamOwnership
} from '@/features/teams/api';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_LABELS: Record<TeamRole, { label: string; color: string; icon: React.ReactNode }> = {
  owner: { label: 'Sahip', color: 'bg-yellow-100 text-yellow-800', icon: <Crown className="h-3 w-3" /> },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800', icon: <Shield className="h-3 w-3" /> },
  member: { label: 'Üye', color: 'bg-gray-100 text-gray-800', icon: <User className="h-3 w-3" /> }
};

export default function TeamMembersPage() {
  const params = useParams();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<TeamRole | null>(null);
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
      
      // Load team data
      const teams = await fetchTeams();
      const currentTeam = teams.find(t => t.id === teamId);
      if (!currentTeam) {
        throw new Error('Takım bulunamadı');
      }
      setTeam(currentTeam);
      
      // Load team members
      const teamMembers = await getTeamMembers(teamId);
      setMembers(teamMembers);
      
      // Determine user role
      const userMember = teamMembers.find(m => m.user_id === user?.id);
      setUserRole(userMember?.role || null);
      
    } catch (error) {
      console.error('Takım verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: TeamRole) => {
    try {
      await updateTeamMemberRole({ team_id: teamId, user_id: userId, new_role: newRole });
      toast.success('Üye rolü güncellendi');
      loadTeamData();
    } catch (error) {
      toast.error('Rol güncellenemedi');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeTeamMember({ team_id: teamId, user_id: userId });
      toast.success('Üye takımdan çıkarıldı');
      loadTeamData();
    } catch (error) {
      toast.error('Üye çıkarılamadı');
    }
  };

  const handleLeaveTeam = async () => {
    try {
      await leaveTeam(teamId);
      toast.success('Takımdan ayrıldınız');
      // Redirect to teams list
      window.location.href = '/dashboard/teams';
    } catch (error) {
      toast.error('Takımdan ayrılamadınız');
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    try {
      await transferTeamOwnership({ team_id: teamId, new_owner_id: newOwnerId });
      toast.success('Takım sahipliği devredildi');
      setTransferOwnershipOpen(false);
      loadTeamData();
    } catch (error) {
      toast.error('Sahiplik devredilemedi');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Takım Bulunamadı</h2>
        <p className="text-muted-foreground mt-2">
          Aradığınız takım mevcut değil veya erişim yetkiniz yok.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/teams">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Takımlara Dön
          </Link>
        </Button>
      </div>
    );
  }

  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin' || isOwner;
  const canManageMembers = isOwner || isAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/teams/${teamId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Takıma Dön
            </Link>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">{team.name} - Üyeler</h1>
            <p className="text-muted-foreground">Takım üyelerini yönetin ve davet edin</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/teams/${teamId}`}>
              <Users className="h-4 w-4 mr-2" />
              Genel Bakış
            </Link>
          </Button>
        </div>
      </div>

      {/* Üye Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Üyeler ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isCurrentUser={member.user_id === currentUser}
                isOwner={isOwner}
                isAdmin={isAdmin}
                onUpdateRole={handleUpdateRole}
                onRemove={handleRemoveMember}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Takımdan Ayrılma */}
      {!isOwner && (
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-destructive">Takımdan Ayrıl</h3>
                <p className="text-sm text-muted-foreground">
                  Bu takımdan ayrılmak istiyorsanız, aşağıdaki butona tıklayın
                </p>
              </div>
              <Button variant="destructive" onClick={handleLeaveTeam}>
                <UserPlus className="h-4 w-4 mr-2" />
                Takımdan Ayrıl
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sahiplik Devretme */}
      {isOwner && (
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-yellow-800">Sahiplik Devret</h3>
                <p className="text-sm text-muted-foreground">
                  Takım sahipliğini başka bir üyeye devredebilirsiniz
                </p>
              </div>
              <Button variant="outline" onClick={() => setTransferOwnershipOpen(true)}>
                <Crown className="h-4 w-4 mr-2" />
                Sahiplik Devret
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sahiplik Devretme Dialog */}
      <TransferOwnershipDialog
        open={transferOwnershipOpen}
        onOpenChange={setTransferOwnershipOpen}
        members={members.filter(m => m.user_id !== currentUser)}
        onTransfer={handleTransferOwnership}
        teamName={team.name}
      />
    </div>
  );
}

// Üye Satırı Bileşeni
function MemberRow({ 
  member, 
  isCurrentUser, 
  isOwner, 
  isAdmin, 
  onUpdateRole, 
  onRemove 
}: {
  member: TeamMember;
  isCurrentUser: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  onUpdateRole: (userId: string, role: TeamRole) => void;
  onRemove: (userId: string) => void;
}) {
  const [roleChangeOpen, setRoleChangeOpen] = useState(false);
  const [newRole, setNewRole] = useState<TeamRole>(member.role);
  const canManageRole = isOwner && !isCurrentUser && member.role !== 'owner';
  const canRemove = (isOwner || isAdmin) && !isCurrentUser && member.role !== 'owner';

  const roleInfo = ROLE_LABELS[member.role];

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback>
              {member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{member.name || 'İsimsiz Kullanıcı'}</div>
            <div className="text-sm text-muted-foreground">{member.email}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={roleInfo.color}>
            {roleInfo.icon}
            <span className="ml-1">{roleInfo.label}</span>
          </Badge>
          
          <div className="text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 inline mr-1" />
            {new Date(member.joined_at).toLocaleDateString('tr-TR')}
          </div>
          
          {(canManageRole || canRemove) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Üye İşlemleri</DropdownMenuLabel>
                {canManageRole && (
                  <DropdownMenuItem onClick={() => setRoleChangeOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Rol Değiştir
                  </DropdownMenuItem>
                )}
                {canRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600" 
                      onClick={() => onRemove(member.user_id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Takımdan Çıkar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Rol Değiştirme Dialog */}
      <Dialog open={roleChangeOpen} onOpenChange={setRoleChangeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üye Rolünü Değiştir</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Yeni Rol</label>
              <Select value={newRole} onValueChange={(value: TeamRole) => setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Üye</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={() => {
              onUpdateRole(member.user_id, newRole);
              setRoleChangeOpen(false);
            }}>
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Sahiplik Devretme Dialog Bileşeni
function TransferOwnershipDialog({ 
  open, 
  onOpenChange, 
  members, 
  onTransfer, 
  teamName 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: TeamMember[];
  onTransfer: (newOwnerId: string) => void;
  teamName: string;
}) {
  const [newOwnerId, setNewOwnerId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerId) return;
    
    onTransfer(newOwnerId);
    setNewOwnerId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{teamName} Takım Sahipliğini Devret</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Yeni Takım Sahibi</label>
            <Select value={newOwnerId} onValueChange={setNewOwnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Yeni sahip seçin" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.name || member.email} ({ROLE_LABELS[member.role].label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Dikkat: Bu işlem geri alınamaz. Takım sahipliği seçilen üyeye devredilecek.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={!newOwnerId} variant="destructive">
              Sahipliği Devret
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
