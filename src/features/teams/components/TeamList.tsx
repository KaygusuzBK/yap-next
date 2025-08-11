"use client";

import { useEffect, useState } from 'react';
import { fetchTeams, type Team, updateTeamName, deleteTeam } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { MoreVertical } from 'lucide-react';
import Input from '@/components/ui/input';
import type { ChangeEvent } from 'react';

export default function TeamList({ refreshKey }: { refreshKey?: number }) {
  const [items, setItems] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchTeams();
        setItems(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  if (loading) return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 border rounded">
          <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!items.length) return <p className="text-sm text-muted-foreground py-8">Henüz takım yok. İlk takımınızı oluşturun.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((t) => (
        <Card key={t.id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span>{t.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-normal text-muted-foreground">{t.id.slice(0, 6)}</span>
                <TeamMenu
                  team={t}
                  onRenamed={(newName) => setItems((arr) => arr.map((x) => (x.id === t.id ? { ...x, name: newName } : x)))}
                  onDeleted={() => setItems((arr) => arr.filter((x) => x.id !== t.id))}
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">Oluşturan: {t.owner_id}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TeamMenu({ team, onRenamed, onDeleted }: { team: Team; onRenamed: (name: string) => void; onDeleted: () => void }) {
  const [openRename, setOpenRename] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState(team.name);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTeamName({ team_id: team.id, name: newName.trim() });
      onRenamed(newName.trim());
      setOpenRename(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteTeam(team.id);
    setOpenDelete(false);
    onDeleted();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost"><MoreVertical /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Takım</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setOpenRename(true)}>İsmi Değiştir</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={() => setOpenDelete(true)}>Sil</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openRename} onOpenChange={setOpenRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Takım adını değiştir</DialogTitle>
          </DialogHeader>
          <Input value={newName} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRename(false)}>Vazgeç</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misin?</AlertDialogTitle>
            <AlertDialogDescription>Bu işlem geri alınamaz. Takım kalıcı olarak silinecek.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


