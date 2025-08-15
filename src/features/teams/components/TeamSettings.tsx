"use client";

import { useEffect, useMemo, useState } from "react";
import type { Team, TeamMember } from "@/features/teams/api";
import { updateTeam, setTeamPrimaryProject, transferTeamOwnership, leaveTeam, getTeamMembers } from "@/features/teams/api";
import { fetchProjects, type Project } from "@/features/projects/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TeamSettings({ team, onUpdated }: { team: Team; onUpdated?: (t: Team) => void }) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState<string | "">(team.description ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | "">(team.avatar_url ?? "");
  const [primaryProjectId, setPrimaryProjectId] = useState<string | "">(team.primary_project_id ?? "");

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingPrimary, setSavingPrimary] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState<string>("");
  const [transferring, setTransferring] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    setName(team.name);
    setDescription(team.description ?? "");
    setAvatarUrl(team.avatar_url ?? "");
    setPrimaryProjectId(team.primary_project_id ?? "");
  }, [team]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProjects(true);
        const all = await fetchProjects();
        setProjects(all.filter(p => p.team_id === team.id));
      } finally {
        setLoadingProjects(false);
      }
    };
    load();
  }, [team.id]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoadingMembers(true);
        const list = await getTeamMembers(team.id);
        setMembers(list);
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [team.id]);

  const selectedProject = useMemo(() => projects.find(p => p.id === primaryProjectId) || null, [projects, primaryProjectId]);
  const transferCandidates = useMemo(() => members.filter(m => m.user_id !== team.owner_id), [members, team.owner_id]);

  const handleSaveGeneral = async () => {
    setErrorMsg(null); setOkMsg(null); setSavingGeneral(true);
    try {
      const updated = await updateTeam({ team_id: team.id, name, description, avatar_url: avatarUrl });
      setOkMsg("Genel bilgiler güncellendi");
      onUpdated?.(updated);
    } catch {
      setErrorMsg("Kaydedilemedi");
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSavePrimary = async () => {
    setErrorMsg(null); setOkMsg(null); setSavingPrimary(true);
    try {
      const pid = primaryProjectId || null;
      const updated = await setTeamPrimaryProject({ team_id: team.id, project_id: pid });
      setOkMsg("Birincil proje güncellendi");
      onUpdated?.(updated);
    } catch {
      setErrorMsg("Kaydedilemedi");
    } finally {
      setSavingPrimary(false);
    }
  };

  const handleTransfer = async () => {
    if (!newOwnerId) return;
    setErrorMsg(null); setOkMsg(null); setTransferring(true);
    try {
      await transferTeamOwnership({ team_id: team.id, new_owner_id: newOwnerId });
      setOkMsg("Sahiplik devredildi");
      onUpdated?.({ ...team, owner_id: newOwnerId });
    } catch (e) {
      setErrorMsg((e as Error)?.message || "İşlem başarısız");
    } finally {
      setTransferring(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Bu takımdan ayrılmak istediğinize emin misiniz?")) return;
    setErrorMsg(null); setOkMsg(null);
    try {
      await leaveTeam(team.id);
      setOkMsg("Takımdan ayrıldınız");
    } catch (e) {
      setErrorMsg((e as Error)?.message || "İşlem başarısız");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Genel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="team-name">Takım Adı</Label>
              <Input id="team-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Takım adı" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar-url">Avatar URL</Label>
              <Input id="avatar-url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="team-desc">Açıklama</Label>
              <Textarea id="team-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Takım hakkında kısa açıklama" rows={4} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveGeneral} disabled={savingGeneral || !name.trim()}>
              {savingGeneral ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            {okMsg && <span className="text-sm text-green-600">{okMsg}</span>}
            {errorMsg && <span className="text-sm text-red-600">{errorMsg}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Birincil Proje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label>Proje Seç</Label>
            <Select value={primaryProjectId || "__none__"} onValueChange={(v) => setPrimaryProjectId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder={loadingProjects ? "Yükleniyor..." : "Bir proje seçin (opsiyonel)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Seçilmesin —</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && (
              <p className="text-xs text-muted-foreground">Seçili: {selectedProject.title}</p>
            )}
          </div>
          <div>
            <Button onClick={handleSavePrimary} disabled={savingPrimary}>
              {savingPrimary ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sahiplik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label>Yeni Sahip</Label>
            <Select value={newOwnerId} onValueChange={(v) => setNewOwnerId(v)}>
              <SelectTrigger>
                <SelectValue placeholder={loadingMembers ? "Yükleniyor..." : "Bir üye seçin"} />
              </SelectTrigger>
              <SelectContent>
                {transferCandidates.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.name || m.email || m.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button onClick={handleTransfer} disabled={!newOwnerId || transferring}>
              {transferring ? "Devrediliyor..." : "Sahipliği Devret"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Tehlikeli Bölge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Takımdan ayrılmak geri alınamaz. Takım sahibi ayrılmadan önce sahipliği devretmelidir.</p>
          <Button variant="destructive" onClick={handleLeave}>Takımdan Ayrıl</Button>
        </CardContent>
      </Card>
    </div>
  );
}
