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
  FolderOpen, 
  CheckCircle, 
  Clock, 
  Crown, 
  Settings,
  ArrowLeft,
  Edit,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { 
  fetchTeams, 
  type Team, 
  getTeamStats, 
  type TeamStats,
  getTeamMembers,
  type TeamMember,
  type TeamRole
} from '@/features/teams/api';
import TeamMembers from '@/features/teams/components/TeamMembers';
import TeamSettings from '@/features/teams/components/TeamSettings';
import { getSupabase } from '@/lib/supabase';

const ROLE_LABELS: Record<TeamRole, { label: string; color: string; icon: React.ReactNode }> = {
  owner: { label: 'Sahip', color: 'bg-yellow-100 text-yellow-800', icon: <Crown className="h-3 w-3" /> },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800', icon: <Shield className="h-3 w-3" /> },
  member: { label: 'Üye', color: 'bg-gray-100 text-gray-800', icon: <Users className="h-3 w-3" /> }
};

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<TeamRole | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview');

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
      
      // Load team stats
      const teamStats = await getTeamStats(teamId);
      setStats(teamStats);
      
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
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
  const canEdit = isOwner || isAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/teams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Link>
          </Button>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={team.avatar_url || undefined} />
              <AvatarFallback className="text-2xl font-bold">
                {team.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-3xl font-bold">{team.name}</h1>
              {team.description && (
                <p className="text-muted-foreground mt-1 max-w-2xl">
                  {team.description}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {canEdit && (
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'members'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Üyeler
          </button>
          {canEdit && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Ayarlar
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Üye</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.member_count}</div>
                  <p className="text-xs text-muted-foreground">
                    Aktif takım üyeleri
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projeler</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.project_count}</div>
                  <p className="text-xs text-muted-foreground">
                    Takım projeleri
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aktif Görevler</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active_task_count}</div>
                  <p className="text-xs text-muted-foreground">
                    Devam eden görevler
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed_task_count}</div>
                  <p className="text-xs text-muted-foreground">
                    Tamamlanan görevler
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle>Takım Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Takım Adı</label>
                  <p className="text-sm">{team.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Oluşturulma Tarihi</label>
                  <p className="text-sm">
                    {new Date(team.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                
                {team.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Açıklama</label>
                    <p className="text-sm">{team.description}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Takım Sahibi</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Crown className="h-3 w-3 mr-1" />
                      Sahip
                    </Badge>
                    <span className="text-sm">{team.owner_id.slice(0, 8)}...</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Son Güncelleme</label>
                  <p className="text-sm">
                    {new Date(team.updated_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Members */}
          <Card>
            <CardHeader>
              <CardTitle>Son Eklenen Üyeler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {member.name || 'İsimsiz Kullanıcı'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={ROLE_LABELS[member.role].color}>
                        {ROLE_LABELS[member.role].icon}
                        <span className="ml-1">{ROLE_LABELS[member.role].label}</span>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(member.joined_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))}
                
                {members.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('members')}>
                      Tüm Üyeleri Görüntüle ({members.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <TeamMembers
          teamId={teamId}
          teamName={team.name}
          isOwner={isOwner}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === 'settings' && canEdit && (
        <TeamSettings team={team} onUpdated={(t) => setTeam(t)} />
      )}
    </div>
  );
}


