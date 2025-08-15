"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  getTeamMembers, 
  getTeamInvitations, 
  inviteToTeam, 
  bulkInviteToTeam,
  revokeTeamInvitation, 
  resendTeamInvitation,
  updateTeamMemberRole,
  removeTeamMember,
  leaveTeam,
  transferTeamOwnership,
  type TeamMember,
  type TeamInvitation,
  type TeamRole
} from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
// Unused AlertDialog variants removed
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
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  Crown, 
  Shield, 
  User, 
  Mail, 
  Calendar,
  Settings,
  Trash2,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';

interface TeamMembersProps {
  teamId: string;
  teamName: string;
  isOwner: boolean;
  isAdmin: boolean;
}

const ROLE_LABELS: Record<TeamRole, { label: string; color: string; icon: React.ReactNode }> = {
  owner: { label: 'Sahip', color: 'bg-yellow-100 text-yellow-800', icon: <Crown className="h-3 w-3" /> },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800', icon: <Shield className="h-3 w-3" /> },
  member: { label: 'Üye', color: 'bg-gray-100 text-gray-800', icon: <User className="h-3 w-3" /> }
};

export default function TeamMembers({ teamId, teamName, isOwner, isAdmin }: TeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [bulkInviteDialogOpen, setBulkInviteDialogOpen] = useState(false);
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [membersData, invitationsData] = await Promise.all([
        getTeamMembers(teamId),
        getTeamInvitations(teamId)
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadData();
    getCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);


  const getCurrentUser = async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);
  };

  const handleInvite = async (email: string, role: TeamRole, message?: string) => {
    try {
      await inviteToTeam({ team_id: teamId, email, role, message });
      toast.success(`${email} adresine davet gönderildi`);
      setInviteDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Davet gönderilemedi');
    }
  };

  const handleBulkInvite = async (emails: string[], role: TeamRole, message?: string) => {
    try {
      const result = await bulkInviteToTeam({ team_id: teamId, emails, role, message });
      toast.success(`${result.success.length} davet başarıyla gönderildi`);
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} davet gönderilemedi`);
      }
      setBulkInviteDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Toplu davet gönderilemedi');
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      await revokeTeamInvitation(invitationId);
      toast.success('Davet iptal edildi');
      loadData();
    } catch (error) {
      toast.error('Davet iptal edilemedi');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await resendTeamInvitation(invitationId);
      toast.success('Davet yeniden gönderildi');
      loadData();
    } catch (error) {
      toast.error('Davet yeniden gönderilemedi');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: TeamRole) => {
    try {
      await updateTeamMemberRole({ team_id: teamId, user_id: userId, new_role: newRole });
      toast.success('Üye rolü güncellendi');
      loadData();
    } catch (error) {
      toast.error('Rol güncellenemedi');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeTeamMember({ team_id: teamId, user_id: userId });
      toast.success('Üye takımdan çıkarıldı');
      loadData();
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
      loadData();
    } catch (error) {
      toast.error('Sahiplik devredilemedi');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Üye Yönetimi Başlığı */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Takım Üyeleri</h2>
          <p className="text-muted-foreground">{teamName} takımının üyeleri ve davetleri</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setInviteDialogOpen(true)} variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Üye Davet Et
          </Button>
          <Button onClick={() => setBulkInviteDialogOpen(true)} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Toplu Davet
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

      {/* Davet Listesi */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Bekleyen Davetler ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <InvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  canManage={isOwner || isAdmin}
                  onRevoke={handleRevokeInvitation}
                  onResend={handleResendInvitation}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <LogOut className="h-4 w-4 mr-2" />
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

      {/* Davet Dialog */}
      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={handleInvite}
        teamName={teamName}
      />

      {/* Toplu Davet Dialog */}
      <BulkInviteDialog
        open={bulkInviteDialogOpen}
        onOpenChange={setBulkInviteDialogOpen}
        onInvite={handleBulkInvite}
        teamName={teamName}
      />

      {/* Sahiplik Devretme Dialog */}
      <TransferOwnershipDialog
        open={transferOwnershipOpen}
        onOpenChange={setTransferOwnershipOpen}
        members={members.filter(m => m.user_id !== currentUser)}
        onTransfer={handleTransferOwnership}
        teamName={teamName}
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
                  <MoreVertical className="h-4 w-4" />
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

// Davet Satırı Bileşeni
function InvitationRow({ 
  invitation, 
  canManage, 
  onRevoke, 
  onResend 
}: {
  invitation: TeamInvitation;
  canManage: boolean;
  onRevoke: (id: string) => void;
  onResend: (id: string) => void;
}) {
  const roleInfo = ROLE_LABELS[invitation.role as TeamRole];
  const isExpired = new Date() > new Date(invitation.expires_at);

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            <Mail className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{invitation.email}</div>
          <div className="text-sm text-muted-foreground">
            Davet edildi: {new Date(invitation.created_at).toLocaleDateString('tr-TR')}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge className={roleInfo.color}>
          {roleInfo.icon}
          <span className="ml-1">{roleInfo.label}</span>
        </Badge>
        
        {isExpired && (
          <Badge variant="destructive">Süresi Dolmuş</Badge>
        )}
        
        {canManage && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onResend(invitation.id)}
              disabled={isExpired}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Yeniden Gönder
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => onRevoke(invitation.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              İptal Et
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Davet Dialog Bileşeni
function InviteDialog({ 
  open, 
  onOpenChange, 
  onInvite, 
  teamName 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: TeamRole, message?: string) => void;
  teamName: string;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('member');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    onInvite(email.trim(), role, message.trim() || undefined);
    setEmail('');
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{teamName} Takımına Üye Davet Et</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">E-posta Adresi</label>
            <Input
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Rol</label>
            <Select value={role} onValueChange={(value: TeamRole) => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Üye</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Mesaj (Opsiyonel)</label>
            <Textarea
              placeholder="Davet mesajı ekleyebilirsiniz..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={!email.trim()}>
              Davet Gönder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Toplu Davet Dialog Bileşeni
function BulkInviteDialog({ 
  open, 
  onOpenChange, 
  onInvite, 
  teamName 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (emails: string[], role: TeamRole, message?: string) => void;
  teamName: string;
}) {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<TeamRole>('member');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emails.trim()) return;
    
    const emailList = emails.split('\n').map(e => e.trim()).filter(e => e);
    if (emailList.length === 0) return;
    
    onInvite(emailList, role, message.trim() || undefined);
    setEmails('');
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{teamName} Takımına Toplu Üye Davet Et</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">E-posta Adresleri</label>
            <Textarea
              placeholder="Her satıra bir e-posta adresi yazın&#10;ornek1@email.com&#10;ornek2@email.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Her satıra bir e-posta adresi yazın
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium">Rol</label>
            <Select value={role} onValueChange={(value: TeamRole) => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Üye</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Mesaj (Opsiyonel)</label>
            <Textarea
              placeholder="Davet mesajı ekleyebilirsiniz..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={!emails.trim()}>
              Toplu Davet Gönder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
