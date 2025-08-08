"use client";

import { useState, useEffect } from 'react';
import Input from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createProject } from '../api';
import { fetchTeams } from '@/features/teams/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Folder } from 'lucide-react';

type Team = {
  id: string;
  name: string;
  owner_id: string;
};

export default function NewProjectForm({ onCreated }: { onCreated?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('personal');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      const teamsData = await fetchTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Takımlar yüklenirken hata:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Proje başlığı gereklidir');
      return;
    }

    setLoading(true);
    try {
      await createProject({ 
        title: title.trim(), 
        description: description.trim() || null,
        team_id: selectedTeamId === 'personal' ? null : selectedTeamId
      });
      toast.success('Proje başarıyla oluşturuldu!');
      setTitle('');
      setDescription('');
      setSelectedTeamId('personal');
      onCreated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Proje oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Yeni Proje Oluştur
        </CardTitle>
        <CardDescription>
          Yeni bir proje oluşturun ve takımınızla işbirliği yapın
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Proje Başlığı *</Label>
            <Input
              id="title"
              placeholder="Proje başlığını girin"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              placeholder="Proje açıklamasını girin (opsiyonel)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Takım (Opsiyonel)</Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Takım seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Kişisel Proje</SelectItem>
                {loadingTeams ? (
                  <SelectItem value="loading" disabled>Takımlar yükleniyor...</SelectItem>
                ) : teams.length === 0 ? (
                  <SelectItem value="no-teams" disabled>Takım bulunamadı</SelectItem>
                ) : (
                  teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {team.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Oluşturuluyor...' : 'Proje Oluştur'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


